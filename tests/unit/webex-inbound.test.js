import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateInboundMessage } from '../../src/handlers/webex-inbound.js';
import { webexMessage } from '../fixtures/webex.js';

test('accepts text-only messages with epoch-ms timestamp and UUID aliasId', () => {
  const r = validateInboundMessage(webexMessage());
  assert.equal(r.ok, true);
  assert.equal(r.value.timestamp, Date.parse('2026-10-07T20:00:00.000Z'));
  assert.match(r.value.aliasId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(validateInboundMessage(webexMessage({ extra: { files: [], attachments: [] } })).ok, true);
});

test('rejects empty, whitespace, files, attachments and oversize text', () => {
  assert.equal(validateInboundMessage(webexMessage({ text: '' })).reason, 'empty');
  assert.equal(validateInboundMessage(webexMessage({ text: '   \n' })).reason, 'empty');
  assert.equal(validateInboundMessage(webexMessage({ extra: { text: undefined } })).reason, 'empty');
  assert.equal(validateInboundMessage(webexMessage({ extra: { files: ['https://example.com/f.png'] } })).reason, 'non-text');
  assert.equal(validateInboundMessage(webexMessage({ extra: { attachments: [{ contentType: 'x' }] } })).reason, 'non-text');
  assert.equal(validateInboundMessage(webexMessage({ text: 'a'.repeat(20001) })).reason, 'non-text');
  assert.equal(validateInboundMessage(webexMessage({ text: 'a'.repeat(20000) })).ok, true);
});
