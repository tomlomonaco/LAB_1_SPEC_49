import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (...p) => readFileSync(path.join(root, ...p), 'utf8');

test('every client endpoint call is documented with its URL and spec source', () => {
  const wxcc = read('src', 'clients', 'wxcc.js');
  assert.match(wxcc, /POST \/v2\/tasks \(createTaskRouteV2\)/);
  assert.match(wxcc, /POST \/v2\/tasks\/\{taskId\}\/messages \(appendTaskMessageV2\)/);
  assert.match(wxcc, /webex-openapi-specs\/blob\/main\/public-spec\/webex-contact-center\.json/);
  const webex = read('src', 'clients', 'webex.js');
  assert.match(webex, /GET \/v1\/messages\/\{messageId\}/);
  assert.match(webex, /POST \/v1\/messages \(Create a Message\)/);
  assert.match(webex, /webex-openapi-specs\/blob\/main\/public-spec\/webex-messaging\.json/);
  assert.match(read('src', 'clients', 'wxcc-auth.js'), /developer\.webex\.com\/docs\/authentication#using-the-refresh-token/);
});

test('202 on Create Task is backed by DEV-001 in deviations.md; no /v1/tasks usage', () => {
  const wxcc = read('src', 'clients', 'wxcc.js');
  assert.match(wxcc, /approvedDeviation: 202, deviationId: 'DEV-001'/);
  const dev = read('deviations.md');
  assert.match(dev, /DEV-001/); assert.match(dev, /\/v2\/tasks/); assert.match(dev, /202 Accepted/);
  assert.match(dev, /Approver|\| Approver/); assert.match(dev, /2026-10-07/);
  assert.equal(/\/v1\/tasks/.test(wxcc), false);
});
