// Configuration loading and validation (FR-024, FR-025). Errors name variables only, never values.
const PAIR_ID_RULE = /^[a-zA-Z0-9_-]{1,64}$/;

export class ConfigError extends Error {
  constructor(variables) {
    super(`Invalid configuration: ${variables.join(', ')}`);
    this.name = 'ConfigError';
    this.variables = variables;
  }
}

const REQUIRED = [
  'BRIDGE_WS_BASE_URL', 'PAIR_ID', 'RECONNECT_DELAY_MS', 'RECONNECT_MAX_DELAY_MS',
  'WEBEX_API_ROOT_URL', 'WEBEX_BOT_TOKEN', 'WEBEX_BOT_EMAIL',
  'WXCC_API_ROOT_URL', 'WXCC_TOKEN_URL', 'WXCC_CLIENT_ID', 'WXCC_CLIENT_SECRET',
  'WXCC_REFRESH_TOKEN', 'WXCC_BUSINESS_ADDRESS', 'WXCC_CHANNEL_NAME',
  'PENDING_TASK_TIMEOUT_MS', 'READINESS_PORT'
];
const INTEGERS = ['RECONNECT_DELAY_MS', 'RECONNECT_MAX_DELAY_MS', 'PENDING_TASK_TIMEOUT_MS', 'READINESS_PORT'];

function isRoot(value, protocol) {
  try {
    const u = new URL(value);
    return u.protocol === protocol && u.host !== '' && u.pathname === '/' && !u.search && !u.hash &&
      !u.username && !u.password && /^[a-z]+:\/\/[^/]+$/i.test(value.replace(/\/$/, ''));
  } catch {
    return false;
  }
}

function isEndpoint(value, protocol) {
  try {
    return new URL(value).protocol === protocol;
  } catch {
    return false;
  }
}

export function validateConfig(env) {
  const bad = new Set();
  for (const name of REQUIRED) {
    if (typeof env[name] !== 'string' || env[name].trim() === '') bad.add(name);
  }
  const get = (n) => (env[n] ?? '').trim();
  if (!bad.has('BRIDGE_WS_BASE_URL') && !isRoot(get('BRIDGE_WS_BASE_URL'), 'wss:')) bad.add('BRIDGE_WS_BASE_URL');
  for (const n of ['WEBEX_API_ROOT_URL', 'WXCC_API_ROOT_URL']) {
    if (!bad.has(n) && !isRoot(get(n), 'https:')) bad.add(n);
  }
  if (!bad.has('WXCC_TOKEN_URL') && !isEndpoint(get('WXCC_TOKEN_URL'), 'https:')) bad.add('WXCC_TOKEN_URL');
  if (!bad.has('PAIR_ID') && !PAIR_ID_RULE.test(get('PAIR_ID'))) bad.add('PAIR_ID');
  for (const n of INTEGERS) {
    if (!bad.has(n) && !/^[1-9][0-9]*$/.test(get(n))) bad.add(n);
  }
  if (bad.size) throw new ConfigError([...bad]);

  const root = (n) => get(n).replace(/\/$/, '');
  return Object.freeze({
    bridge: Object.freeze({
      wsBaseUrl: root('BRIDGE_WS_BASE_URL'),
      pairId: get('PAIR_ID'),
      reconnectDelayMs: Number(get('RECONNECT_DELAY_MS')),
      reconnectMaxDelayMs: Number(get('RECONNECT_MAX_DELAY_MS'))
    }),
    webex: Object.freeze({
      rootUrl: root('WEBEX_API_ROOT_URL'),
      botToken: get('WEBEX_BOT_TOKEN'),
      botEmail: get('WEBEX_BOT_EMAIL')
    }),
    wxcc: Object.freeze({
      rootUrl: root('WXCC_API_ROOT_URL'),
      tokenUrl: get('WXCC_TOKEN_URL'),
      clientId: get('WXCC_CLIENT_ID'),
      clientSecret: get('WXCC_CLIENT_SECRET'),
      refreshToken: get('WXCC_REFRESH_TOKEN'),
      businessAddress: get('WXCC_BUSINESS_ADDRESS'),
      channelName: get('WXCC_CHANNEL_NAME')
    }),
    service: Object.freeze({
      pendingTaskTimeoutMs: Number(get('PENDING_TASK_TIMEOUT_MS')),
      readinessPort: Number(get('READINESS_PORT'))
    })
  });
}

export function loadConfig(env = process.env, { loadFile = true } = {}) {
  if (loadFile) {
    try {
      process.loadEnvFile();
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return validateConfig(env);
}
