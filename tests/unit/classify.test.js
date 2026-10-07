import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify } from '../../src/events/classify.js';
import * as w from '../fixtures/wxcc.js';
import { messageCreatedWebhook } from '../fixtures/webex.js';

const env = (payload) => ({ pairId: 'p', eventId: 'evt_1', receivedAt: '2026-10-07T20:00:00Z', contentType: 'application/json', payload });
const kind = (p) => classify(env(p));

test('Webex messages.created', () => {
  const c = kind(messageCreatedWebhook());
  assert.equal(c.source, 'webex'); assert.equal(c.kind, 'webex.message.created');
  assert.equal(c.bridge.eventId, 'evt_1');
});

test('Webex other resource/event and malformed data are unsupported', () => {
  assert.equal(kind({ ...messageCreatedWebhook(), resource: 'rooms' }).reason, 'unsupported-event');
  assert.equal(kind({ ...messageCreatedWebhook(), event: 'deleted' }).reason, 'unsupported-event');
  assert.equal(kind({ ...messageCreatedWebhook(), data: { id: 'x' } }).reason, 'malformed-payload');
});

test('WxCC lifecycle kinds use data.direction', () => {
  assert.equal(kind(w.taskNew()).kind, 'wxcc.task.new');
  assert.equal(kind(w.taskNew()).direction, 'INBOUND');
  assert.equal(kind(w.taskFailed()).kind, 'wxcc.task.failed');
  assert.equal(kind(w.taskEnded()).kind, 'wxcc.task.ended');
});

test('task:new with OUTBOUND direction is wrong-direction; task:ended is matched in any direction', () => {
  assert.equal(kind(w.taskNew({ direction: 'OUTBOUND' })).reason, 'wrong-direction');
  assert.equal(kind(w.taskEnded({ direction: 'OUTBOUND' })).kind, 'wxcc.task.ended');
});

test('WxCC messages use data.messageDirection', () => {
  assert.equal(kind(w.outboundAppended()).kind, 'wxcc.message.outbound');
  assert.equal(kind(w.inboundAppended()).kind, 'wxcc.message.inbound');
  const bad = w.outboundAppended(); bad.data.messageDirection = 'SIDEWAYS';
  assert.equal(kind(bad).reason, 'malformed-payload');
  assert.equal(kind(w.appendFailed()).kind, 'wxcc.message.append-failed');
});

test('wrong channel, unsupported types, malformed payloads', () => {
  const other = w.taskNew(); other.data.channelType = 'chat';
  assert.equal(kind(other).reason, 'wrong-channel');
  assert.equal(kind({ ...w.taskNew(), type: 'agent:login' }).reason, 'unsupported-event');
  const noTask = w.taskEnded(); delete noTask.data.taskId;
  assert.equal(kind(noTask).reason, 'malformed-payload');
  const noId = w.outboundAppended(); delete noId.id;
  assert.equal(kind(noId).reason, 'malformed-payload');
});

test('neither or both markers -> unknown source', () => {
  assert.equal(kind({ hello: 'world' }).reason, 'unknown-source');
  assert.equal(kind({ ...messageCreatedWebhook(), specversion: '1.0', type: 'task:new' }).reason, 'unknown-source');
  assert.equal(kind({ ...messageCreatedWebhook(), specversion: '1.0', type: 'task:new' }).source, 'unknown');
});
