import { test, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHarness } from '../helpers/harness.js';
import { messageCreatedWebhook, ROOM_ID } from '../fixtures/webex.js';
import { taskNew, outboundAppended, taskEnded, taskFailed } from '../fixtures/wxcc.js';
import { wrap, malformed } from '../fixtures/bridge.js';

let h;
beforeEach(async () => { h = await createHarness(); });
afterEach(async () => { await h.close(); });

const creates = () => h.mock.requests.filter((r) => r.method === 'POST' && r.path === '/v2/tasks');
const webexPosts = () => h.mock.where('POST', '/v1/messages');
const lastReject = () => h.logs.find('validation.reject', 'rejected').at(-1) ?? h.logs.find('webex.ignore', 'rejected').at(-1) ?? h.logs.find('bridge.envelope', 'rejected').at(-1);
const rejectReasons = () => h.logs.entries().filter((e) => e.outcome === 'rejected').map((e) => e.reason);

// ---- loops ----
for (const [label, email] of [['business address', 'support@channel.example'], ['business address (case)', 'Support@Channel.Example'], ['bot', 'BOT@webex.bot']]) {
  test(`${label} sender is ignored: no fetch, no WxCC call`, async () => {
    await h.send(messageCreatedWebhook({ personEmail: email }));
    assert.equal(h.mock.requests.length, 0);
    assert.match(rejectReasons().at(-1), /business-address-sender|bot-sender/);
  });
}

test('sender revealed only by the fetched message is also ignored', async () => {
  h.mock.addWebexMessage({ id: 'M1', personEmail: 'support@channel.example' });
  await h.send(messageCreatedWebhook({ messageId: 'M1' }));
  assert.equal(creates().length, 0);
  assert.equal(rejectReasons().at(-1), 'business-address-sender');
});

// ---- duplicates ----
test('same Webex message replayed (new bridge eventIds) creates/appends once', async () => {
  h.mock.addWebexMessage({ id: 'M1' });
  await h.send(messageCreatedWebhook({ messageId: 'M1' }));
  await h.send(messageCreatedWebhook({ messageId: 'M1' }));
  await h.send(taskNew());
  await h.send(messageCreatedWebhook({ messageId: 'M1' }));
  assert.equal(creates().length, 1);
  assert.equal(h.mock.requests.filter((r) => /\/messages$/.test(r.path) && r.path.startsWith('/v2/')).length, 0);
  assert.equal(h.logs.find('webex.message', 'duplicate').length, 2);
});

test('concurrent duplicate Webex frames are processed once', async () => {
  h.mock.addWebexMessage({ id: 'M1' });
  await Promise.all([h.send(messageCreatedWebhook({ messageId: 'M1' })), h.send(messageCreatedWebhook({ messageId: 'M1' }))]);
  assert.equal(creates().length, 1);
});

test('replayed outbound event (same id, or same aliasId with a different id) posts once', async () => {
  h.mock.addWebexMessage({ id: 'M1' });
  await h.send(messageCreatedWebhook({ messageId: 'M1' })); await h.send(taskNew());
  h.mock.requests.length = 0;
  await h.send(outboundAppended({ id: 'o1', aliasId: 'a1' }));
  await h.send(outboundAppended({ id: 'o1', aliasId: 'a1' }));
  await h.send(outboundAppended({ id: 'o2', aliasId: 'a1' }));
  assert.equal(webexPosts().length, 1);
  assert.equal(h.logs.find('routing.outbound', 'duplicate').length, 2);
});

test('replayed lifecycle events are handled once', async () => {
  h.mock.addWebexMessage({ id: 'M1' });
  await h.send(messageCreatedWebhook({ messageId: 'M1' }));
  await h.send(taskNew({})); await h.send(taskNew({ id: 'again' }));
  assert.equal(h.logs.find('task.active', 'success').length, 1);
  h.mock.requests.length = 0;
  await h.send(taskEnded()); await h.send(taskEnded({ id: 'again' }));
  assert.equal(webexPosts().length, 1);
  await h.send(taskFailed()); await h.send(taskFailed({ id: 'x' }));
  assert.equal(webexPosts().length, 1);
});

// ---- rejections ----
const invalid = [
  ['empty text', { text: '' }, 'empty'],
  ['whitespace text', { text: '  \n ' }, 'empty'],
  ['files present', { extra: { files: ['https://webexapis.com/v1/contents/x'] } }, 'non-text'],
  ['attachments present', { extra: { attachments: [{ contentType: 'application/vnd.microsoft.card.adaptive' }] } }, 'non-text']
];
for (const [label, opts, reason] of invalid) {
  test(`rejects ${label} before any WxCC call`, async () => {
    h.mock.addWebexMessage({ id: 'MX', ...opts });
    await h.send(messageCreatedWebhook({ messageId: 'MX' }));
    assert.equal(h.mock.requests.filter((r) => r.path.startsWith('/v2/')).length, 0);
    assert.equal(h.app.store.get(ROOM_ID), undefined);
    assert.equal(rejectReasons().at(-1), reason);
  });
}

const frames = () => [
  ['non-messages resource', wrap({ ...messageCreatedWebhook(), resource: 'rooms' }), 'unsupported-event'],
  ['non-created event', wrap({ ...messageCreatedWebhook(), event: 'deleted' }), 'unsupported-event'],
  ['webex payload missing ids', wrap({ ...messageCreatedWebhook(), data: { personEmail: 'x@example.com' } }), 'malformed-payload'],
  ['unknown source', wrap({ hello: 'world' }), 'unknown-source'],
  ['unsupported WxCC type', wrap({ ...taskNew(), type: 'agent:login' }), 'unsupported-event'],
  ['wrong channel', wrap({ ...taskNew(), data: { ...taskNew().data, channelType: 'chat' } }), 'wrong-channel'],
  ['task:new OUTBOUND direction', wrap(taskNew({ direction: 'OUTBOUND' })), 'wrong-direction'],
  ['bad JSON', malformed.badJson, 'malformed-envelope'],
  ['wrong pairId', malformed.wrongPair(messageCreatedWebhook()), 'malformed-envelope'],
  ['missing eventId', malformed.missingEventId(messageCreatedWebhook()), 'malformed-envelope']
];
for (const [label, raw, reason] of frames()) {
  test(`rejects ${label} (${reason}) with no side effects`, async () => {
    await h.sendRaw(raw);
    assert.equal(h.mock.requests.length, 0);
    assert.equal(rejectReasons().at(-1), reason);
    if (reason === 'malformed-envelope') assert.equal(lastReject().level, 'error');
  });
}

test('an identical bridge frame replayed is skipped (bridge delivery key)', async () => {
  h.mock.addWebexMessage({ id: 'MB' });
  const raw = wrap(messageCreatedWebhook({ messageId: 'MB' }));
  await h.sendRaw(raw); await h.sendRaw(raw);
  assert.equal(creates().length, 1);
  const dup = h.logs.find('bridge.frame', 'duplicate');
  assert.equal(dup.length, 1);
  assert.match(dup[0].key, /^bridge:test_pair:evt_/);
  assert.equal(h.logs.find('webex.message', 'duplicate').length, 0);
});