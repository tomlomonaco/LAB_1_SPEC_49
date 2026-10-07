import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createWxccAuth } from '../../src/clients/wxcc-auth.js';
import { createWxccClient } from '../../src/clients/wxcc.js';
import {
  validateAppendRequest, validateCreateTaskRequest
} from '../../src/contracts/validators.js';
import { captureLogs, startMock, SECRETS } from '../helpers/harness.js';
import { TASK_ID, createTaskResponse, errorBodies, BUSINESS_ADDRESS } from '../fixtures/wxcc.js';

let mock; let logs; let client;
const ALIAS = '123e4567-e89b-12d3-a456-426614174000';
const args = { personEmail: 'customer@example.com', text: 'hello', timestamp: 1732786800000, aliasId: ALIAS };

before(async () => {
  mock = await startMock(); logs = captureLogs();
  const auth = createWxccAuth({ tokenUrl: `${mock.url}/v1/access_token`, clientId: 'c', clientSecret: SECRETS.clientSecret, refreshToken: SECRETS.refreshToken });
  client = createWxccClient({ rootUrl: mock.url, auth, channelName: 'my-custom-channel', businessAddress: BUSINESS_ADDRESS });
});
after(async () => { logs.restore(); await mock.close(); });
beforeEach(() => {
  mock.requests.length = 0;
  for (const k of ['POST /v2/tasks', `POST /v2/tasks/${TASK_ID}/messages`, 'POST /v1/access_token']) mock.override(k, undefined);
});

test('create task: exact URL/method/headers/body, approved 202 accepted and logged as DEV-001', async () => {
  const { taskId } = await client.createTask(args);
  assert.equal(taskId, TASK_ID);
  const [tokenReq, r] = mock.requests;
  assert.equal(tokenReq.path, '/v1/access_token');
  assert.equal(r.method, 'POST'); assert.equal(r.path, '/v2/tasks');
  assert.equal(r.headers.authorization, 'Bearer FAKE_ACCESS_TOKEN');
  assert.match(r.headers['content-type'], /application\/json/);
  assert.deepEqual(r.body, {
    origin: { id: 'customer@example.com' },
    destination: { id: BUSINESS_ADDRESS, type: 'businessAddress' },
    channelType: 'customMessaging', channel: 'my-custom-channel',
    channelParams: { type: 'text', message: { aliasId: ALIAS, text: 'hello', timestamp: 1732786800000 } }
  });
  assert.equal(validateCreateTaskRequest(r.body).valid, true);
  assert.equal(logs.find('wxcc.create-task', 'success').at(-1).deviation, 'DEV-001');
});

test('create task: documented 201 is also accepted (no deviation flag)', async () => {
  mock.override('POST /v2/tasks', { status: 201, body: createTaskResponse() });
  await client.createTask(args);
  assert.equal(logs.find('wxcc.create-task', 'success').at(-1).deviation, undefined);
});

test('create task: response body must match the schema even on 202', async () => {
  mock.override('POST /v2/tasks', { status: 202, body: { data: {} } });
  await assert.rejects(client.createTask(args), (e) => e.reason === 'contract-violation');
});

for (const status of [200, 400, 401, 403, 500, 503]) {
  test(`create task: status ${status} is a failure`, async () => {
    mock.override('POST /v2/tasks', { status, body: errorBodies[status] ?? {} });
    await assert.rejects(client.createTask(args), (e) => e.status === status);
  });
}

test('append: POST /v2/tasks/{id}/messages, 202 only, body validated', async () => {
  await client.createTask(args); mock.requests.length = 0;
  const { messageEventId } = await client.appendMessage(TASK_ID, { text: 'more', timestamp: 1732786800001, aliasId: ALIAS });
  assert.ok(messageEventId);
  const r = mock.requests.at(-1);
  assert.equal(r.method, 'POST'); assert.equal(r.path, `/v2/tasks/${TASK_ID}/messages`);
  assert.deepEqual(r.body, { mediaType: 'customMessaging', channelParams: { type: 'text', message: { aliasId: ALIAS, text: 'more', timestamp: 1732786800001 } } });
  assert.equal(validateAppendRequest(r.body).valid, true);
});

for (const status of [200, 201, 400, 403, 429, 500]) {
  test(`append: status ${status} is a failure`, async () => {
    mock.override(`POST /v2/tasks/${TASK_ID}/messages`, { status, body: errorBodies[status] ?? {} });
    await assert.rejects(client.appendMessage(TASK_ID, { text: 'x', timestamp: 1, aliasId: ALIAS }), (e) => e.status === status);
  });
}

test('401 triggers exactly one token refresh and retry', async () => {
  mock.override('POST /v2/tasks', [{ status: 401, body: errorBodies[401] }, { status: 202, body: createTaskResponse() }]);
  await client.createTask(args);
  assert.equal(mock.where('POST', '/v2/tasks').length, 2);
  assert.equal(mock.where('POST', '/v1/access_token').length >= 1, true);
});

test('only /v2/tasks is ever called (never /v1/tasks)', async () => {
  await client.createTask(args);
  assert.equal(mock.requests.some((r) => r.path.startsWith('/v1/tasks')), false);
});
