// Webex Messaging API client.
// Spec: https://github.com/webex/webex-openapi-specs/blob/main/public-spec/webex-messaging.json
import { log } from '../log.js';
import { ContractError, HttpError, send } from './http.js';
import { validateWebexMessage } from '../contracts/validators.js';

export function createWebexClient({ rootUrl, botToken }) {
  const headers = () => ({ Authorization: `Bearer ${botToken}`, Accept: 'application/json' });

  async function call(operation, ids, url, init) {
    try {
      const res = await send(url, init);
      if (res.status !== 200) throw new HttpError(`Webex ${operation} failed with status ${res.status}`, { status: res.status, body: res.text });
      const check = validateWebexMessage(res.json);
      if (!check.valid) throw new ContractError(`Webex ${operation} response violates the Message schema`, { status: res.status, errors: check.errors });
      log('info', operation, 'success', { ...ids, status: res.status });
      return res.json;
    } catch (error) {
      log('error', operation, 'failure', ids, error);
      throw error;
    }
  }

  return {
    // GET /v1/messages/{messageId} (Get Message Details) - 200
    getMessage: (messageId) =>
      call('webex.get-message', { messageId }, `${rootUrl}/v1/messages/${encodeURIComponent(messageId)}`, { method: 'GET', headers: headers() }),
    // POST /v1/messages (Create a Message) - 200
    postMessage: (roomId, text) =>
      call('webex.create-message', { roomId }, `${rootUrl}/v1/messages`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, text })
      })
  };
}
