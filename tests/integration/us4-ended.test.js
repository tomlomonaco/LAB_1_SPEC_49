import { test, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness } from '../helpers/harness.js';
import { messageCreatedWebhook, ROOM_ID } from '../fixtures/webex.js';
import { TASK_ID, taskNew, taskEnded, appendFailed } from '../fixtures/wxcc.js';
import { CHAT_ENDED_TEXT } from '../../src/messages.js';

let h;
beforeEach(async () => {
  h = await createHarness();
  h.mock.addWebexMessage({ id: 'M1' });
  await h.send(messageCreatedWebhook({ messageId: 'M1' })); await h.send(taskNew());
  h.mock.requests.length = 0;
});
afterEach(async () => { await h.close(); });

const notices = () => h.mock.where('POST', '/v1/messages');

test('task:ended posts one chat-ended notice and clears the association (any direction)', async () => {
  await h.send(taskEnded({ direction: 'OUTBOUND' }));
  assert.equal(notices().length, 1);
  assert.deepEqual(notices()[0].body, { roomId: ROOM_ID, text: CHAT_ENDED_TEXT });
  assert.equal(h.app.store.get(ROOM_ID), undefined);
  assert.equal(h.logs.find('conversation.cleared', 'success').length, 1);
});

test('next message after closure creates a new task', async () => {
  await h.send(taskEnded());
  h.mock.addWebexMessage({ id: 'M2' });
  await h.send(messageCreatedWebhook({ messageId: 'M2' }));
  assert.equal(h.mock.requests.filter((r) => r.method === 'POST' && r.path === '/v2/tasks').length, 1);
});

test('unknown task, duplicate ended, and other lifecycle types send nothing extra', async () => {
  await h.send(taskEnded({ taskId: 'ffffffff-ffff-ffff-ffff-ffffffffffff', id: 'x1' }));
  assert.equal(notices().length, 0);
  await h.send(taskEnded({ id: 'e1' })); await h.send(taskEnded({ id: 'e2' }));
  assert.equal(notices().length, 1);
  const other = taskEnded({ id: 'e3' }); other.type = 'task:connected';
  await h.send(other);
  assert.equal(notices().length, 1);
  assert.equal(h.logs.find('validation.reject', 'rejected').at(-1).reason, 'unsupported-event');
  assert.equal(TASK_ID.length > 0 && appendFailed !== undefined, true);
});
