import { test, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness } from '../helpers/harness.js';
import { messageCreatedWebhook, ROOM_ID } from '../fixtures/webex.js';
import { TASK_ID, taskNew, outboundAppended, inboundAppended } from '../fixtures/wxcc.js';

let h;
beforeEach(async () => {
  h = await createHarness();
  h.mock.addWebexMessage({ id: 'M1' });
  await h.send(messageCreatedWebhook({ messageId: 'M1' })); await h.send(taskNew());
  h.mock.requests.length = 0;
});
afterEach(async () => { await h.close(); });

const webexPosts = () => h.mock.where('POST', '/v1/messages');
const wxccCalls = () => h.mock.requests.filter((r) => r.path.startsWith('/v2/') || r.path.startsWith('/v1/access_token'));

test('system and agent outbound messages post once each to the room and never reach WxCC', async () => {
  await h.send(outboundAppended({ id: 'o1', aliasId: 'a1', text: 'from agent' }));
  await h.send(outboundAppended({ id: 'o2', aliasId: 'a2', text: 'from flow', senderType: 'system' }));
  assert.deepEqual(webexPosts().map((r) => r.body), [{ roomId: ROOM_ID, text: 'from agent' }, { roomId: ROOM_ID, text: 'from flow' }]);
  assert.equal(wxccCalls().length, 0);
});

test('inbound task-message:appended confirmation causes no Webex post and no WxCC call', async () => {
  await h.send(inboundAppended());
  assert.equal(webexPosts().length, 0); assert.equal(wxccCalls().length, 0);
  assert.equal(h.logs.find('routing.inbound-echo', 'skipped').length, 1);
});

test('unknown task id: no post, unknown-task rejection', async () => {
  await h.send(outboundAppended({ taskId: 'ffffffff-ffff-ffff-ffff-ffffffffffff' }));
  assert.equal(webexPosts().length, 0);
  assert.equal(h.logs.find('validation.reject', 'rejected').at(-1).reason, 'unknown-task');
});

test('outbound with attachments posts text only and warns; attachment-only is rejected', async () => {
  const att = [{ url: 'https://attachment-api.example.com/api/v1/attachments/x', mimeType: 'application/pdf', fileName: 'a.pdf' }];
  await h.send(outboundAppended({ id: 'o3', aliasId: 'a3', text: 'see attached', attachments: att }));
  assert.equal(webexPosts().length, 1);
  assert.equal(h.logs.find('routing.outbound', 'skipped').at(-1).droppedAttachments, 1);
  await h.send(outboundAppended({ id: 'o4', aliasId: 'a4', text: '', attachments: att }));
  assert.equal(webexPosts().length, 1);
  assert.equal(h.logs.find('validation.reject', 'rejected').at(-1).reason, 'non-text');
});

test('Webex post failure is logged and does not throw', async () => {
  h.mock.override('POST /v1/messages', { status: 500, body: {} });
  await h.send(outboundAppended({ id: 'o5', aliasId: 'a5' }));
  assert.equal(h.logs.find('routing.outbound', 'failure').length, 1);
  assert.equal(TASK_ID.length > 0, true);
});
