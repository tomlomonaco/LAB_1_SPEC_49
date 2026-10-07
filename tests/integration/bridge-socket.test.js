import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocketServer } from 'ws';
import { createBridgeClient } from '../../src/bridge/socket.js';
import { captureLogs } from '../helpers/harness.js';

async function server() {
  const wss = new WebSocketServer({ port: 0, host: '127.0.0.1' });
  await new Promise((r) => wss.once('listening', r));
  const sockets = []; const paths = [];
  wss.on('connection', (s, req) => { sockets.push(s); paths.push(req.url); });
  return { wss, sockets, paths, base: `ws://127.0.0.1:${wss.address().port}` };
}
const until = async (fn, ms = 3000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (fn()) return; await new Promise((r) => setTimeout(r, 10)); }
  throw new Error('timeout waiting for condition');
};

test('connects to the pair socket path, processes frames in arrival order, reports readiness', async () => {
  const logs = captureLogs(); const s = await server();
  const seen = [];
  const c = createBridgeClient({
    wsBaseUrl: s.base, pairId: 'pair/odd id', reconnectDelayMs: 10, reconnectMaxDelayMs: 40,
    onFrame: async (raw) => { await new Promise((r) => setTimeout(r, raw === 'one' ? 50 : 0)); seen.push(raw); }
  });
  try {
    assert.equal(c.isReady(), false);
    c.start();
    await until(() => c.isReady());
    assert.equal(s.paths[0], '/v1/pairs/pair%2Fodd%20id/socket');
    s.sockets[0].send('one'); s.sockets[0].send('two'); s.sockets[0].send('three');
    await until(() => seen.length === 3);
    assert.deepEqual(seen, ['one', 'two', 'three']);
  } finally { await c.stop(); s.wss.close(); logs.restore(); }
});

test('disconnect -> not ready -> bounded-backoff reconnect; no replay assumed', async () => {
  const logs = captureLogs(); const s = await server();
  const c = createBridgeClient({ wsBaseUrl: s.base, pairId: 'p', reconnectDelayMs: 10, reconnectMaxDelayMs: 40, onFrame: async () => {} });
  try {
    c.start(); await until(() => c.isReady());
    s.sockets[0].close(1011, 'server restart');
    await until(() => !c.isReady());
    await until(() => c.isReady() && s.sockets.length === 2);
    assert.equal(logs.find('bridge.disconnect').length >= 1, true);
    assert.equal(logs.find('bridge.reconnect', 'success').length, 1);
  } finally { await c.stop(); s.wss.close(); logs.restore(); }
});

test('takeover close is logged as error and not reconnected', async () => {
  const logs = captureLogs(); const s = await server();
  const c = createBridgeClient({ wsBaseUrl: s.base, pairId: 'p', reconnectDelayMs: 10, reconnectMaxDelayMs: 40, onFrame: async () => {} });
  try {
    c.start(); await until(() => c.isReady());
    s.sockets[0].close(4000, 'takeover');
    await until(() => logs.find('bridge.takeover').length === 1);
    await new Promise((r) => setTimeout(r, 150));
    assert.equal(s.sockets.length, 1); assert.equal(c.isReady(), false);
    assert.equal(logs.find('bridge.takeover')[0].level, 'error');
  } finally { await c.stop(); s.wss.close(); logs.restore(); }
});

test('a frame handler failure is logged and later frames still process', async () => {
  const logs = captureLogs(); const s = await server(); const seen = [];
  const c = createBridgeClient({
    wsBaseUrl: s.base, pairId: 'p', reconnectDelayMs: 10, reconnectMaxDelayMs: 40,
    onFrame: async (raw) => { if (raw === 'bad') throw new Error('boom'); seen.push(raw); }
  });
  try {
    c.start(); await until(() => c.isReady());
    s.sockets[0].send('bad'); s.sockets[0].send('good');
    await until(() => seen.length === 1);
    assert.equal(logs.find('bridge.frame', 'failure').length, 1);
  } finally { await c.stop(); s.wss.close(); logs.restore(); }
});
