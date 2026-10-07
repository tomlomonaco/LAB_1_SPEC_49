import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { createApp } from '../../src/app.js';
import { createHarness, makeConfig, SECRETS } from '../helpers/harness.js';
import { messageCreatedWebhook, CUSTOMER_EMAIL } from '../fixtures/webex.js';
import { taskNew, taskEnded, outboundAppended, taskFailed } from '../fixtures/wxcc.js';
import { captureLogs, startMock } from '../helpers/harness.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const entry = path.join(root, 'src', 'index.js');

function run(env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [entry], { cwd: mkdtempSync(path.join(tmpdir(), 'byoc-')), env: { PATH: process.env.PATH, ...env } });
    let out = ''; let err = '';
    child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => resolve({ code, out, err }));
  });
}

test('missing required variable: exits 1, names the variable only, never opens a socket', async () => {
  const r = await run({ PAIR_ID: 'p', WEBEX_BOT_TOKEN: SECRETS.botToken });
  assert.equal(r.code, 1);
  const entry = r.err.trim().split('\n').map((l) => JSON.parse(l)).find((e) => e.operation === 'config.validate');
  assert.equal(entry.outcome, 'failure');
  assert.ok(entry.variables.includes('BRIDGE_WS_BASE_URL'));
  assert.equal(r.err.includes(SECRETS.botToken), false);
  assert.equal(r.out.includes('bridge.connect'), false);
});

test('valid config: socket connects and /ready becomes 200', async () => {
  const wss = new WebSocketServer({ port: 0, host: '127.0.0.1' });
  await new Promise((r) => wss.once('listening', r));
  const mock = await startMock(); const logs = captureLogs();
  const config = makeConfig(mock.url);
  config.bridge.wsBaseUrl = `ws://127.0.0.1:${wss.address().port}`;
  const app = createApp(config);
  try {
    await app.start();
    const port = app.readiness.server.address().port;
    const end = Date.now() + 3000;
    while (!app.bridge.isReady() && Date.now() < end) await new Promise((r) => setTimeout(r, 10));
    assert.equal((await fetch(`http://127.0.0.1:${port}/ready`)).status, 200);
  } finally { await app.stop(); wss.close(); await mock.close(); logs.restore(); }
});

test('log audit: single-line JSON with required fields; no secrets, emails or message text across all flows', async () => {
  const h = await createHarness();
  try {
    const secretText = 'my very private message body';
    h.mock.override('POST /v2/tasks', [{ status: 202, body: { meta: { orgId: 'cb5901fb-ab66-4377-a7bc-5f0b21896952' }, data: { id: '044ea619-a0ad-41a3-9ed9-c2563a9bd6b7' } } }]);
    h.mock.addWebexMessage({ id: 'M1', text: secretText });
    await h.send(messageCreatedWebhook({ messageId: 'M1' })); await h.send(taskNew());
    h.mock.addWebexMessage({ id: 'M2', text: `${secretText} 2` });
    await h.send(messageCreatedWebhook({ messageId: 'M2' }));
    await h.send(outboundAppended({ text: secretText }));
    await h.send(messageCreatedWebhook({ messageId: 'M2' }));
    await h.send(messageCreatedWebhook({ personEmail: 'support@channel.example', messageId: 'M9' }));
    h.mock.override('POST /v1/messages', { status: 500, body: { echoed: `Bearer ${SECRETS.botToken} ${CUSTOMER_EMAIL} client_secret=${SECRETS.clientSecret}` } });
    await h.send(taskEnded());
    await h.send(taskFailed()); await h.sendRaw('{bad');
    assert.ok(h.logs.lines.length > 15);
    const all = h.logs.lines.map((l) => l.line).join('\n');
    for (const bad of [SECRETS.botToken, SECRETS.clientSecret, SECRETS.refreshToken, CUSTOMER_EMAIL, secretText, 'FAKE_ACCESS_TOKEN']) {
      assert.equal(all.includes(bad), false, `leaked: ${bad}`);
    }
    for (const l of h.logs.lines) {
      assert.equal(l.line.includes('\n'), false);
      const e = JSON.parse(l.line);
      for (const f of ['timestamp', 'level', 'operation', 'outcome']) assert.ok(e[f], f);
      assert.ok(['info', 'warn', 'error'].includes(e.level));
      if (e.outcome === 'failure') assert.ok(e.error || e.reason || e.status || e.retryInMs !== undefined || e.code !== undefined || e.pairId, `failure without context: ${l.line}`);
    }
    for (const op of ['wxcc.create-task', 'wxcc.append-message', 'routing.outbound', 'task.active', 'task.pending', 'webex.get-message', 'routing.classify', 'task.ended', 'validation.reject', 'webex.ignore']) {
      assert.ok(h.logs.find(op).length >= 1, `missing log for ${op}`);
    }
  } finally { await h.close(); }
});

