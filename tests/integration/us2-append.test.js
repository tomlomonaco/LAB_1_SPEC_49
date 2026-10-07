import { test, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness } from '../helpers/harness.js';
import { messageCreatedWebhook, ROOM_ID } from '../fixtures/webex.js';
import {
  TASK_ID, taskNew, taskFailed, taskEnded, appendFailed, appendResponse
} from '../fixtures/wxcc.js';
import { DELIVERY_FAILED_TEXT } from '../../src/messages.js';

let h;
beforeEach(async () => { h = await createHarness({ service: { pendingTaskTimeoutMs: 30000, readinessPort: 0 } }); });
afterEach(async () => { await h.close(); });

const receive = async (id, text) => {
  h.mock.addWebexMessage({ id, ...(text ? { text } : {}) });
  await h.send(messageCreatedWebhook({ messageId: id }));
};
const appends = () => h.mock.where('POST', `/v2/tasks/${TASK_ID}/messages`);

test('active conversation: second message is appended, no new task', async () => {
  await receive('M1'); await h.send(taskNew());
  await receive('M2', 'second');
  assert.equal(h.mock.requests.filter((r) => r.method === 'POST' && r.path === '/v2/tasks').length, 1);
  assert.equal(appends().length, 1);
  assert.equal(appends()[0].body.mediaType, 'customMessaging');
  assert.equal(appends()[0].body.channelParams.type, 'text');
  assert.equal(appends()[0].body.channelParams.message.text, 'second');
});

test('messages while pending are queued in order and appended after task:new (FR-011a)', async () => {
  await receive('M1'); await receive('M2', 'two'); await receive('M3', 'three');
  assert.equal(appends().length, 0);
  assert.equal(h.app.store.get(ROOM_ID).queue.length, 2);
  await h.send(taskNew());
  assert.deepEqual(appends().map((r) => r.body.channelParams.message.text), ['two', 'three']);
  assert.equal(h.mock.requests.filter((r) => r.method === 'POST' && r.path === '/v2/tasks').length, 1);
});

test('task:failed while pending discards the queue, one notice, association cleared', async () => {
  await receive('M1'); await receive('M2', 'two');
  await h.send(taskFailed());
  assert.equal(appends().length, 0);
  assert.equal(h.app.store.get(ROOM_ID), undefined);
  const notices = h.mock.where('POST', '/v1/messages');
  assert.equal(notices.length, 1); assert.equal(notices[0].body.text, DELIVERY_FAILED_TEXT);
  const failed = h.logs.find('task.failed', 'failure')[0];
  assert.equal(failed.error.reason, 'CONVERSATION_ALREADY_OPEN'); assert.equal(failed.droppedMessages, 1);
});

test('after task:ended the next message creates a new task', async () => {
  await receive('M1'); await h.send(taskNew()); await h.send(taskEnded());
  await receive('M2');
  assert.equal(h.mock.requests.filter((r) => r.method === 'POST' && r.path === '/v2/tasks').length, 2);
});

test('pending timeout acts like task:failed (FR-011c)', async () => {
  await h.close();
  h = await createHarness({ service: { pendingTaskTimeoutMs: 80, readinessPort: 0 } });
  await receive('M1'); await receive('M2', 'two');
  await new Promise((r) => setTimeout(r, 250));
  assert.equal(h.app.store.get(ROOM_ID), undefined);
  assert.equal(h.mock.where('POST', '/v1/messages').length, 1);
  assert.equal(h.logs.find('task.pending-timeout', 'failure').length, 1);
});
test('append failure (non-202) sends one notice and does not retry', async () => {
  await receive('M1'); await h.send(taskNew());
  h.mock.override(`POST /v2/tasks/${TASK_ID}/messages`, { status: 500, body: {} });
  await receive('M2', 'two');
  assert.equal(appends().length, 1);
  assert.equal(h.mock.where('POST', '/v1/messages').length, 1);
  assert.equal(h.app.store.get(ROOM_ID).state, 'active');
});

test('task-message:append-failed event sends one notice, task stays active, duplicate ignored', async () => {
  await receive('M1'); await h.send(taskNew());
  await h.send(appendFailed()); await h.send(appendFailed());
  assert.equal(h.mock.where('POST', '/v1/messages').length, 1);
  assert.equal(h.app.store.get(ROOM_ID).state, 'active');
});

test('append success 202 body is schema-validated', async () => {
  await receive('M1'); await h.send(taskNew());
  h.mock.override(`POST /v2/tasks/${TASK_ID}/messages`, { status: 202, body: appendResponse() });
  await receive('M2', 'two');
  assert.equal(h.logs.find('wxcc.append-message', 'success').length, 1);
});

