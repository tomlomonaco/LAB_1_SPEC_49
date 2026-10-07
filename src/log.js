// Structured single-line JSON logging with redaction (Constitution III, V).
const SENSITIVE_KEY = /token|secret|authorization|refresh|password|cookie|credential/i;
const EMAIL_KEY = /email|^origin$|^destination$/i;
const TEXT_KEY = /^(text|markdown|html)$/i;
const EMAIL_VALUE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const BEARER_VALUE = /Bearer\s+[A-Za-z0-9._~+/=-]+/gi;
const JWT_VALUE = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g;

const KEYED_VALUE = /(["']?[\w-]*(?:token|secret|password|authorization|credential)[\w-]*["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,&}]+)/gi;

export function redactString(value) {
  return String(value)
    .replace(BEARER_VALUE, 'Bearer [REDACTED]')
    .replace(JWT_VALUE, '[REDACTED_JWT]')
    .replace(KEYED_VALUE, '$1"[REDACTED]"')
    .replace(EMAIL_VALUE, '[REDACTED_EMAIL]');
}

export function redact(value, key = '', depth = 0) {
  if (value === null || value === undefined) return value;
  if (key && SENSITIVE_KEY.test(key)) return '[REDACTED]';
  if (key && EMAIL_KEY.test(key)) return '[REDACTED_EMAIL]';
  if (key && TEXT_KEY.test(key)) return '[REDACTED_TEXT]';
  if (depth > 6) return '[TRUNCATED]';
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map((v) => redact(v, '', depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k, depth + 1)]));
  }
  return value;
}

function serializeError(error) {
  if (!error) return undefined;
  const e = error instanceof Error ? error : { message: String(error) };
  return redact({
    name: e.name,
    message: e.message,
    status: e.status,
    reason: e.reason,
    ...(e.details ? { details: e.details } : {})
  }, 'error');
}

let sink = (line, level) => {
  (level === 'info' ? process.stdout : process.stderr).write(`${line}\n`);
};

export function setLogSink(fn) {
  const previous = sink;
  sink = fn;
  return previous;
}

export const LEVELS = Object.freeze(['info', 'warn', 'error']);

// level: info (success/transition) | warn (rejected/duplicate/skipped/recoverable) | error (failure)
export function log(level, operation, outcome, ids = {}, error) {
  if (!LEVELS.includes(level)) throw new Error(`Invalid log level: ${level}`);
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    operation,
    outcome,
    ...redact(ids, 'ids'),
    ...(error ? { error: serializeError(error) } : {})
  };
  sink(JSON.stringify(entry), level);
}


