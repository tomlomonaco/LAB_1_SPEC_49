import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRegistry } from '../../src/state/idempotency.js';

test('claim succeeds once then fails', () => {
  const r = createRegistry();
  assert.equal(r.claim('k'), true);
  assert.equal(r.claim('k'), false);
  assert.equal(r.has('k'), true);
});

test('concurrent claims: exactly one winner', async () => {
  const r = createRegistry();
  const results = await Promise.all(Array.from({ length: 20 }, async () => r.claim('same')));
  assert.equal(results.filter(Boolean).length, 1);
});

test('keys are never evicted', () => {
  const r = createRegistry();
  for (let i = 0; i < 5000; i++) r.claim(`k${i}`);
  assert.equal(r.size, 5000);
  assert.equal(r.claim('k0'), false);
});
