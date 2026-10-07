import { test, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness } from '../helpers/harness.js';
import { messageCreatedWebhook, CUSTOMER_EMAIL, ROOM_ID } from '../fixtures/webex.js';
import { TASK_ID, createTaskResponse, taskNew } from '../fixtures/wxcc.js';
import { DELIVERY_FAILED_TEXT } from '../../src/messages.js';

let h;
beforeEach(async () => { h = await createHarness(); });
afterEach(async () => { await h.close(); });

const receive = async (id = 'MSG_1', text) => {
  h.mock.addWebexMessage({ id, ...(text ? { text } : {}) });
  await h.send(messageCreatedWebhook({ messageId: id }));
};

test('valid first message creates one task with origin.id = personEmail (202 per DEV-001)', async () => {
  await receive();
  const creates = h.mock.where('POST', '/v2/tasks');
  assert.equal(creates.length, 1);
  assert.equal(creates[0].body.origin.id, CUSTOMER_EMAIL);
  assert.equal(creates[0].body.channelParams.message.text, 'Hello, I need help with my order.');
  const conv = h.app.store.get(ROOM_ID);
  assert.equal(conv.state, 'pending'); assert.equal(conv.taskId, TASK_ID);
  assert.equal(h.app.store.byTask(TASK_ID).roomId, ROOM_ID);
  assert.equal(h.logs.find('wxcc.create-task', 'success')[0].deviation, 'DEV-001');
});

test('task:new activates the pending conversation', async () => {
  await receive();
  await h.send(taskNew());
  assert.equal(h.app.store.get(ROOM_ID).state, 'active');
  assert.equal(h.logs.find('task.active', 'success').length, 1);
});

test('documented 201 also works', async () => {
  h.mock.override('POST /v2/tasks', { status: 201, body: createTaskResponse() });
  await receive();
  assert.equal(h.app.store.get(ROOM_ID).state, 'pending');
});

for (const status of [400, 500]) {
  test(`create failure (${status}): no association, one delivery-failed notice, no retry`, async () => {
    h.mock.override('POST /v2/tasks', { status, body: { message: 'x' } });
    await receive();
    assert.equal(h.mock.where('POST', '/v2/tasks').length, 1);
    assert.equal(h.app.store.get(ROOM_ID), undefined);
    const posts = h.mock.where('POST', '/v1/messages');
    assert.equal(posts.length, 1);
    assert.equal(posts[0].body.text, DELIVERY_FAILED_TEXT);
    assert.equal(posts[0].body.roomId, ROOM_ID);
    assert.equal(h.logs.find('task.create', 'failure').length, 1);
  });
}

test('invalid create response body is a failure', async () => {
  h.mock.override('POST /v2/tasks', { status: 202, body: { data: {} } });
  await receive();
  assert.equal(h.app.store.get(ROOM_ID), undefined);
  assert.equal(h.mock.where('POST', '/v1/messages').length, 1);
});

test('Webex message fetch failure and notice failure are logged and do not block later events', async () => {
  await h.send(messageCreatedWebhook({ messageId: 'MISSING' }));
  assert.equal(h.mock.where('POST', '/v2/tasks').length, 0);
  assert.equal(h.logs.find('webex.get-message', 'failure').length, 1);
  h.mock.override('POST /v2/tasks', { status: 500, body: {} });
  h.mock.override('POST /v1/messages', { status: 500, body: {} });
  await receive('MSG_2');
  assert.equal(h.logs.find('webex.create-message', 'failure').length, 1);
  h.mock.override('POST /v2/tasks', undefined);
  await receive('MSG_3');
  assert.equal(h.app.store.get(ROOM_ID).state, 'pending');
});

test('task:new arriving between frames cannot race creation (frames are serialized)', async () => {
  h.mock.addWebexMessage({ id: 'MSG_R' });
  await Promise.all([h.send(messageCreatedWebhook({ messageId: 'MSG_R' })), h.send(taskNew())]);
  assert.equal(h.app.store.get(ROOM_ID).state, 'active');
});


test('a failed Webex message fetch logs bridge and room correlation', async () => {
  await h.send(messageCreatedWebhook({ messageId: 'GONE' }));
  const e = h.logs.find('webex.message', 'failure')[0];
  assert.ok(e.bridgeEventId); assert.equal(e.roomId, ROOM_ID); assert.equal(e.messageId, 'GONE');
  assert.equal(e.error.status, 404);
});