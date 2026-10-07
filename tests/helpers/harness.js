// Test harness: loopback mock for the Webex, WxCC and token endpoints plus a fully wired app.
import { createServer } from 'node:http';
import { createApp } from '../../src/app.js';
import { setLogSink } from '../../src/log.js';
import { PAIR_ID, wrap } from '../fixtures/bridge.js';
import { createTaskResponse, appendResponse, tokenResponse } from '../fixtures/wxcc.js';
import { webexMessage, webexCreateMessageResponse } from '../fixtures/webex.js';

export const SECRETS = {
  botToken: 'SENTINEL_BOT_TOKEN', clientSecret: 'SENTINEL_CLIENT_SECRET', refreshToken: 'SENTINEL_REFRESH_TOKEN'
};

export async function startMock() {
  const requests = [];
  const overrides = new Map();
  const webexMessages = new Map();
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    let body = raw;
    if ((req.headers['content-type'] ?? '').includes('application/json') && raw) body = JSON.parse(raw);
    const record = { method: req.method, path: req.url, headers: req.headers, body, raw };
    requests.push(record);
    const key = `${req.method} ${req.url.split('?')[0]}`;
    let reply = overrides.get(key);
    if (Array.isArray(reply)) reply = reply.length > 1 ? reply.shift() : reply[0];
    if (!reply) {
      if (key === 'POST /v1/access_token') reply = { status: 200, body: tokenResponse() };
      else if (key === 'POST /v2/tasks') reply = { status: 202, body: createTaskResponse() };
      else if (/^POST \/v2\/tasks\/[^/]+\/messages$/.test(key)) reply = { status: 202, body: appendResponse() };
      else if (key === 'POST /v1/messages') reply = { status: 200, body: webexCreateMessageResponse(body.roomId, body.text) };
      else if (req.method === 'GET' && req.url.startsWith('/v1/messages/')) {
        const id = decodeURIComponent(req.url.slice('/v1/messages/'.length));
        reply = webexMessages.has(id) ? { status: 200, body: webexMessages.get(id) } : { status: 404, body: { message: 'not found' } };
      } else reply = { status: 404, body: {} };
    }
    res.writeHead(reply.status, { 'Content-Type': 'application/json' });
    res.end(reply.raw ?? JSON.stringify(reply.body));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    url, requests,
    override: (key, reply) => overrides.set(key, reply),
    addWebexMessage: (opts) => { const m = webexMessage(opts); webexMessages.set(m.id, m); return m; },
    where: (method, pathPrefix) => requests.filter((r) => r.method === method && r.path.startsWith(pathPrefix)),
    close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); })
  };
}

export function makeConfig(mockUrl, extra = {}) {
  return {
    bridge: { wsBaseUrl: 'ws://127.0.0.1:1', pairId: PAIR_ID, reconnectDelayMs: 10, reconnectMaxDelayMs: 40 },
    webex: { rootUrl: mockUrl, botToken: SECRETS.botToken, botEmail: 'bot@webex.bot' },
    wxcc: {
      rootUrl: mockUrl, tokenUrl: `${mockUrl}/v1/access_token`, clientId: 'client-id', clientSecret: SECRETS.clientSecret,
      refreshToken: SECRETS.refreshToken, businessAddress: 'support@channel.example', channelName: 'my-custom-channel'
    },
    service: { pendingTaskTimeoutMs: 30000, readinessPort: 0 },
    ...extra
  };
}

export function captureLogs() {
  const lines = [];
  const previous = setLogSink((line, level) => lines.push({ line, level, entry: JSON.parse(line) }));
  return {
    lines,
    entries: () => lines.map((l) => l.entry),
    find: (operation, outcome) => lines.map((l) => l.entry).filter((e) => e.operation === operation && (!outcome || e.outcome === outcome)),
    restore: () => setLogSink(previous)
  };
}

// Builds a mock + app + log capture; `send(payload)` runs one frame through the full pipeline.
export async function createHarness(configExtra = {}) {
  const mock = await startMock();
  const logs = captureLogs();
  const config = makeConfig(mock.url, configExtra);
  const app = createApp(config);
  return {
    mock, logs, app, config,
    send: (payload) => app.processFrame(wrap(payload)),
    sendRaw: (raw) => app.processFrame(raw),
    async close() {
      await app.stop().catch(() => {});
      await mock.close();
      logs.restore();
    }
  };
}
