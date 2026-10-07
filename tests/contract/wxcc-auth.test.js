import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createWxccAuth } from '../../src/clients/wxcc-auth.js';
import { captureLogs, startMock, SECRETS } from '../helpers/harness.js';
import { tokenResponse } from '../fixtures/wxcc.js';

let mock; let logs;
before(async () => { mock = await startMock(); logs = captureLogs(); });
after(async () => { logs.restore(); await mock.close(); });

const make = (extra = {}) => createWxccAuth({
  tokenUrl: `${mock.url}/v1/access_token`, clientId: 'client-id', clientSecret: SECRETS.clientSecret, refreshToken: SECRETS.refreshToken, ...extra
});

test('POSTs form-encoded refresh_token grant to the exact endpoint and caches the token', async () => {
  mock.requests.length = 0;
  const auth = make();
  assert.equal(await auth.getAccessToken(), 'FAKE_ACCESS_TOKEN');
  assert.equal(await auth.getAccessToken(), 'FAKE_ACCESS_TOKEN');
  const reqs = mock.where('POST', '/v1/access_token');
  assert.equal(reqs.length, 1);
  assert.equal(reqs[0].path, '/v1/access_token');
  assert.match(reqs[0].headers['content-type'], /application\/x-www-form-urlencoded/);
  const p = new URLSearchParams(reqs[0].raw);
  assert.deepEqual([p.get('grant_type'), p.get('client_id'), p.get('client_secret'), p.get('refresh_token')],
    ['refresh_token', 'client-id', SECRETS.clientSecret, SECRETS.refreshToken]);
});

test('refreshes within 60s of expiry and keeps a rotated refresh token', async () => {
  mock.requests.length = 0;
  let t = 1_000_000;
  mock.override('POST /v1/access_token', [
    { status: 200, body: tokenResponse({ access_token: 'A1', expires_in: 120, refresh_token: 'ROTATED' }) },
    { status: 200, body: tokenResponse({ access_token: 'A2', expires_in: 3600 }) }
  ]);
  const auth = make({ now: () => t });
  assert.equal(await auth.getAccessToken(), 'A1');
  t += 30_000; assert.equal(await auth.getAccessToken(), 'A1');
  t += 40_000; assert.equal(await auth.getAccessToken(), 'A2');
  const second = new URLSearchParams(mock.where('POST', '/v1/access_token')[1].raw);
  assert.equal(second.get('refresh_token'), 'ROTATED');
  assert.equal(JSON.stringify(logs.entries()).includes('ROTATED'), false);
});

test('invalidate forces a refresh', async () => {
  mock.requests.length = 0;
  mock.override('POST /v1/access_token', { status: 200, body: tokenResponse() });
  const auth = make();
  await auth.getAccessToken(); auth.invalidate(); await auth.getAccessToken();
  assert.equal(mock.where('POST', '/v1/access_token').length, 2);
});

test('failure is logged as error without secrets and thrown', async () => {
  mock.override('POST /v1/access_token', { status: 400, body: { error: 'invalid_grant', client_secret: SECRETS.clientSecret } });
  const auth = make();
  await assert.rejects(auth.getAccessToken(), (e) => e.status === 400);
  const failure = logs.find('wxcc.token-refresh', 'failure').at(-1);
  assert.equal(failure.level, 'error');
  assert.equal(JSON.stringify(logs.entries()).includes(SECRETS.clientSecret), false);
});
