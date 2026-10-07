import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReadinessServer } from '../../src/readiness.js';
import { setLogSink } from '../../src/log.js';

test('GET /ready reflects socket state', async () => {
  const prev = setLogSink(() => {});
  let ready = false;
  const r = createReadinessServer({ isReady: () => ready, port: 0 });
  const port = await r.listen();
  try {
    assert.equal((await fetch(`http://127.0.0.1:${port}/ready`)).status, 503);
    ready = true;
    assert.equal((await fetch(`http://127.0.0.1:${port}/ready`)).status, 200);
    assert.equal((await fetch(`http://127.0.0.1:${port}/other`)).status, 404);
  } finally { await r.close(); setLogSink(prev); }
});
