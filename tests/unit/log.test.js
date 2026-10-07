import { test } from 'node:test';
import assert from 'node:assert/strict';
import { log, redact, setLogSink } from '../../src/log.js';

function capture(fn) {
  const lines = [];
  const prev = setLogSink((line, level) => lines.push({ line, level }));
  try { fn(); } finally { setLogSink(prev); }
  return lines;
}

test('emits one single-line JSON entry with required fields', () => {
  const [l] = capture(() => log('info', 'op.test', 'success', { taskId: 't1' }));
  assert.equal(l.line.includes('\n'), false);
  const e = JSON.parse(l.line);
  assert.equal(e.operation, 'op.test');
  assert.equal(e.outcome, 'success');
  assert.equal(e.level, 'info');
  assert.equal(e.taskId, 't1');
  assert.ok(!Number.isNaN(Date.parse(e.timestamp)));
});

test('error context is serialized', () => {
  const [l] = capture(() => log('error', 'op', 'failure', {}, Object.assign(new Error('boom'), { status: 500, reason: 'X' })));
  const e = JSON.parse(l.line);
  assert.deepEqual({ n: e.error.name, m: e.error.message, s: e.error.status, r: e.error.reason }, { n: 'Error', m: 'boom', s: 500, r: 'X' });
});

test('rejects invalid levels', () => {
  assert.throws(() => log('debug', 'op', 'success'));
});

test('default sink writes info to stdout and warn/error to stderr', () => {
  const defaultSink = setLogSink(() => {});
  setLogSink(defaultSink);
  const out = []; const err = [];
  const so = process.stdout.write; const se = process.stderr.write;
  process.stdout.write = (s) => { out.push(String(s)); return true; };
  process.stderr.write = (s) => { err.push(String(s)); return true; };
  try {
    log('info', 'a', 'success'); log('warn', 'b', 'rejected'); log('error', 'c', 'failure');
  } finally { process.stdout.write = so; process.stderr.write = se; }
  assert.equal(out.length, 1); assert.equal(err.length, 2);
  assert.equal(JSON.parse(out[0]).operation, 'a');
});
test('redacts secrets, emails and text', () => {
  const r = redact({
    botToken: 'abc', Authorization: 'Bearer abc.def', clientSecret: 's', refresh_token: 'r', personEmail: 'a@example.com',
    origin: 'b@example.com', text: 'hello', note: 'mail c@example.com with Bearer tok123', jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijk',
    nested: { password: 'p', textLength: 5 }
  });
  const s = JSON.stringify(r);
  for (const bad of ['abc', 'a@example.com', 'b@example.com', 'c@example.com', 'hello', 'tok123', 'eyJhbGci']) assert.equal(s.includes(bad), false, bad);
  assert.equal(r.nested.textLength, 5);
});

