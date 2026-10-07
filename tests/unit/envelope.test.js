import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnvelope } from '../../src/bridge/envelope.js';
import { PAIR_ID, wrap, malformed } from '../fixtures/bridge.js';

test('valid envelope: payload returned untouched, unknown fields tolerated', () => {
  const payload = { a: 1, nested: { b: [1, 2] } };
  const raw = JSON.stringify({ ...JSON.parse(wrap(payload)), futureField: true });
  const r = parseEnvelope(raw, PAIR_ID);
  assert.equal(r.ok, true);
  assert.deepEqual(r.envelope.payload, payload);
});

for (const [name, raw] of [
  ['invalid JSON', malformed.badJson], ['non-object', malformed.notObject], ['pair mismatch', malformed.wrongPair({ a: 1 })],
  ['missing eventId', malformed.missingEventId({ a: 1 })], ['payload not object', malformed.payloadNotObject],
  ['bad contentType', wrap({ a: 1 }, { contentType: 'text/plain' })], ['missing receivedAt', wrap({ a: 1 }, { receivedAt: undefined })]
]) {
  test(`rejects ${name}`, () => {
    const r = parseEnvelope(raw, PAIR_ID);
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'malformed-envelope');
  });
}
