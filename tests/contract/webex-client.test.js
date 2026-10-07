import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createWebexClient } from '../../src/clients/webex.js';
import { captureLogs, startMock, SECRETS } from '../helpers/harness.js';
import { ROOM_ID, webexMessage } from '../fixtures/webex.js';

let mock; let logs; let client;
before(async () => {
  mock = await startMock(); logs = captureLogs();
  client = createWebexClient({ rootUrl: mock.url, botToken: SECRETS.botToken });
});
after(async () => { logs.restore(); await mock.close(); });

test('GET /v1/messages/{id} with bearer bot token; response schema-validated', async () => {
  mock.requests.length = 0;
  const m = mock.addWebexMessage({ id: 'MSG_A' });
  const got = await client.getMessage('MSG_A');
  assert.deepEqual(got, m);
  const [r] = mock.requests;
  assert.equal(r.method, 'GET'); assert.equal(r.path, '/v1/messages/MSG_A');
  assert.equal(r.headers.authorization, `Bearer ${SECRETS.botToken}`);
});

test('POST /v1/messages sends exactly {roomId, text} as JSON', async () => {
  mock.requests.length = 0;
  await client.postMessage(ROOM_ID, 'hello');
  const [r] = mock.requests;
  assert.equal(r.method, 'POST'); assert.equal(r.path, '/v1/messages');
  assert.match(r.headers['content-type'], /application\/json/);
  assert.deepEqual(r.body, { roomId: ROOM_ID, text: 'hello' });
});

for (const status of [401, 404, 429, 500]) {
  test(`non-200 status ${status} raises an error with status and logs a failure`, async () => {
    mock.override('POST /v1/messages', { status, body: { message: 'nope' } });
    await assert.rejects(client.postMessage(ROOM_ID, 'x'), (e) => e.status === status);
    assert.equal(logs.find('webex.create-message', 'failure').at(-1).error.status, status);
  });
}

test('response violating the Message schema is a contract error', async () => {
  mock.override('POST /v1/messages', { status: 200, body: webexMessage({ extra: { files: 'not-an-array' } }) });
  await assert.rejects(client.postMessage(ROOM_ID, 'x'), (e) => e.reason === 'contract-violation');
  mock.override('POST /v1/messages', undefined);
});

test('logs never contain the bot token', () => {
  assert.equal(JSON.stringify(logs.entries()).includes(SECRETS.botToken), false);
});
