// WxCC task API client (v2/tasks only).
// Spec: https://github.com/webex/webex-openapi-specs/blob/main/public-spec/webex-contact-center.json
import { log } from '../log.js';
import { ContractError, HttpError, send } from './http.js';
import {
  validateAppendRequest, validateAppendResponse, validateCreateTaskRequest, validateCreateTaskResponse
} from '../contracts/validators.js';

// Documented success is 201; the lab returns 202. Approved deviation DEV-001 (deviations.md), create task only.
const CREATE_TASK_SUCCESS = Object.freeze({ documented: 201, approvedDeviation: 202, deviationId: 'DEV-001' });
const APPEND_SUCCESS = 202;

export function createWxccClient({ rootUrl, auth, channelName, businessAddress }) {
  async function post(operation, ids, url, body, okStatuses, validateResponse) {
    let retried = false;
    for (;;) {
      const token = await auth.getAccessToken();
      const res = await send(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.status === 401 && !retried) {
        retried = true;
        auth.invalidate();
        log('warn', operation, 'skipped', { ...ids, status: 401, note: 'token invalid; refreshing once' });
        continue;
      }
      if (!okStatuses.includes(res.status)) {
        throw new HttpError(`WxCC ${operation} failed with status ${res.status}`, { status: res.status, body: res.text });
      }
      const check = validateResponse(res.json);
      if (!check.valid) throw new ContractError(`WxCC ${operation} response violates the published schema`, { status: res.status, errors: check.errors });
      return res;
    }
  }

  return {
    async createTask({ personEmail, text, timestamp, aliasId }) {
      const ids = { aliasId };
      const body = {
        origin: { id: personEmail },
        destination: { id: businessAddress, type: 'businessAddress' },
        channelType: 'customMessaging',
        channel: channelName,
        channelParams: { type: 'text', message: { aliasId, text, timestamp } }
      };
      try {
        const check = validateCreateTaskRequest(body);
        if (!check.valid) throw new ContractError('Create Task request violates the published schema', { errors: check.errors });
        // POST /v2/tasks (createTaskRouteV2); documented 201, lab 202 (DEV-001)
        const res = await post('wxcc.create-task', ids, `${rootUrl}/v2/tasks`, body,
          [CREATE_TASK_SUCCESS.documented, CREATE_TASK_SUCCESS.approvedDeviation], validateCreateTaskResponse);
        const taskId = res.json.data.id;
        log('info', 'wxcc.create-task', 'success', {
          ...ids, taskId, status: res.status,
          ...(res.status === CREATE_TASK_SUCCESS.approvedDeviation ? { deviation: CREATE_TASK_SUCCESS.deviationId } : {})
        });
        return { taskId };
      } catch (error) {
        log('error', 'wxcc.create-task', 'failure', ids, error);
        throw error;
      }
    },

    async appendMessage(taskId, { text, timestamp, aliasId }) {
      const ids = { taskId, aliasId };
      const body = { mediaType: 'customMessaging', channelParams: { type: 'text', message: { aliasId, text, timestamp } } };
      try {
        const check = validateAppendRequest(body);
        if (!check.valid) throw new ContractError('Append Task Message request violates the published schema', { errors: check.errors });
        // POST /v2/tasks/{taskId}/messages (appendTaskMessageV2) - 202
        const res = await post('wxcc.append-message', ids, `${rootUrl}/v2/tasks/${encodeURIComponent(taskId)}/messages`, body,
          [APPEND_SUCCESS], validateAppendResponse);
        log('info', 'wxcc.append-message', 'success', { ...ids, status: res.status });
        return { messageEventId: res.json.data.id };
      } catch (error) {
        log('error', 'wxcc.append-message', 'failure', ids, error);
        throw error;
      }
    }
  };
}
