import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (...p) => readFileSync(path.join(root, ...p), 'utf8');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out); else out.push(full);
  }
  return out;
}

test('.env.example has every variable grouped by service, root URLs without paths, placeholders only', () => {
  const text = read('.env.example');
  const vars = Object.fromEntries(text.split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.split('=')[0], l.slice(l.indexOf('=') + 1)]));
  const expected = ['BRIDGE_WS_BASE_URL', 'PAIR_ID', 'RECONNECT_DELAY_MS', 'RECONNECT_MAX_DELAY_MS', 'WEBEX_API_ROOT_URL', 'WEBEX_BOT_TOKEN',
    'WEBEX_BOT_EMAIL', 'WXCC_API_ROOT_URL', 'WXCC_TOKEN_URL', 'WXCC_CLIENT_ID', 'WXCC_CLIENT_SECRET', 'WXCC_REFRESH_TOKEN',
    'WXCC_BUSINESS_ADDRESS', 'WXCC_CHANNEL_NAME', 'PENDING_TASK_TIMEOUT_MS', 'READINESS_PORT'];
  assert.deepEqual(Object.keys(vars).sort(), expected.sort());
  for (const section of ['Bridge', 'Webex Messaging', 'Webex Contact Center', 'Service']) assert.ok(text.includes(`--- ${section}`), section);
  for (const n of ['BRIDGE_WS_BASE_URL', 'WEBEX_API_ROOT_URL', 'WXCC_API_ROOT_URL']) assert.equal(new URL(vars[n]).pathname, '/', n);
  for (const n of ['WEBEX_BOT_TOKEN', 'WXCC_CLIENT_ID', 'WXCC_CLIENT_SECRET', 'WXCC_REFRESH_TOKEN']) assert.match(vars[n], /^<.+>$/, n);
  assert.ok(text.includes('# endpoint') && text.includes('# root'));
});

test('no hardcoded path separators in filesystem path construction (src, tests, scripts)', () => {
  const files = ['src', 'tests', 'scripts'].flatMap((d) => walk(path.join(root, d))).filter((f) => f.endsWith('.js') && !f.endsWith('paths-and-artifacts.test.js'));
  const offenders = [];
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    if (/(readFileSync|readdirSync|writeFile|mkdtempSync|path\.join|path\.resolve)\([^)]*['"`][^'"`]*[\\/][^'"`]*['"`]/.test(text.replace(/https?:\/\/\S+/g, ''))) offenders.push(path.relative(root, f));
  }
  assert.deepEqual(offenders, []);
});

test('artifacts contain no token-like strings or real-looking emails', () => {
  const targets = [...['src', 'tests', 'scripts', 'specs'].flatMap((d) => walk(path.join(root, d))).filter((f) => !f.endsWith('-schemas.json')),
    path.join(root, 'README.md'), path.join(root, '.env.example'), path.join(root, 'deviations.md')];
  const offenders = [];
  for (const f of targets) {
    let text; try { text = readFileSync(f, 'utf8'); } catch { continue; }
    const base = path.basename(f);
    if (/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\./.test(text)) offenders.push(`${base}: jwt`);
    if (/Bearer\s+(?!\[REDACTED\]|<|\$\{|abc|tok|FAKE|SENTINEL|\.\.\.)[A-Za-z0-9._-]{12,}/.test(text)) offenders.push(`${base}: bearer`);
    for (const m of text.matchAll(/[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)) {
      if (!/(^|\.)(example\.com|channel\.example|webex\.bot|bridge\.example\.com)$/i.test(m[1]) && !/\.(js|json|md)$/.test(m[0])) offenders.push(`${base}: ${m[0]}`);
    }
  }
  assert.deepEqual(offenders, []);
});

