import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ConfigError, validateConfig } from '../../src/config.js';

const valid = () => ({
  BRIDGE_WS_BASE_URL: 'wss://bridge.example.com', PAIR_ID: 'pair_1', RECONNECT_DELAY_MS: '1000', RECONNECT_MAX_DELAY_MS: '30000',
  WEBEX_API_ROOT_URL: 'https://webexapis.com', WEBEX_BOT_TOKEN: 'tok', WEBEX_BOT_EMAIL: 'bot@webex.bot',
  WXCC_API_ROOT_URL: 'https://api.wxcc-us1.cisco.com', WXCC_TOKEN_URL: 'https://webexapis.com/v1/access_token',
  WXCC_CLIENT_ID: 'id', WXCC_CLIENT_SECRET: 'sec', WXCC_REFRESH_TOKEN: 'ref', WXCC_BUSINESS_ADDRESS: 'support@channel.example',
  WXCC_CHANNEL_NAME: 'chan', PENDING_TASK_TIMEOUT_MS: '30000', READINESS_PORT: '3000'
});

test('accepts valid configuration and keeps the token URL verbatim', () => {
  const c = validateConfig(valid());
  assert.equal(c.wxcc.tokenUrl, 'https://webexapis.com/v1/access_token');
  assert.equal(c.webex.rootUrl, 'https://webexapis.com');
  assert.equal(c.service.readinessPort, 3000);
  assert.ok(Object.isFrozen(c));
});

test('names missing variables without leaking values', () => {
  const env = valid(); delete env.WEBEX_BOT_TOKEN; env.WXCC_CLIENT_SECRET = '  ';
  try { validateConfig(env); assert.fail('expected'); } catch (e) {
    assert.ok(e instanceof ConfigError);
    assert.deepEqual(e.variables.sort(), ['WEBEX_BOT_TOKEN', 'WXCC_CLIENT_SECRET']);
    assert.equal(e.message.includes('sec'), false);
  }
});

for (const [name, value] of [
  ['WEBEX_API_ROOT_URL', 'https://webexapis.com/v1'], ['WEBEX_API_ROOT_URL', 'http://webexapis.com'],
  ['WXCC_API_ROOT_URL', 'https://api.example.com?x=1'], ['WXCC_API_ROOT_URL', 'not a url'],
  ['BRIDGE_WS_BASE_URL', 'https://bridge.example.com'], ['BRIDGE_WS_BASE_URL', 'wss://bridge.example.com/v1'],
  ['WXCC_TOKEN_URL', 'http://webexapis.com/v1/access_token'], ['PAIR_ID', 'bad pair!'], ['PAIR_ID', 'x'.repeat(65)],
  ['RECONNECT_DELAY_MS', '0'], ['READINESS_PORT', 'abc'], ['PENDING_TASK_TIMEOUT_MS', '-5']
]) {
  test(`rejects ${name}=${value}`, () => {
    const env = valid(); env[name] = value;
    assert.throws(() => validateConfig(env), (e) => e.variables.includes(name));
  });
}

test('root URLs allow subdomains and a single trailing slash is normalized', () => {
  const env = valid(); env.WXCC_API_ROOT_URL = 'https://api.wxcc-eu1.cisco.com/';
  assert.equal(validateConfig(env).wxcc.rootUrl, 'https://api.wxcc-eu1.cisco.com');
});
