// Vendors verbatim OpenAPI component schemas (with every transitive $ref target) from the
// official published specs: https://github.com/webex/webex-openapi-specs/tree/main/public-spec
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://raw.githubusercontent.com/webex/webex-openapi-specs/main/public-spec/';
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'contracts');

async function load(name) {
  const res = await fetch(`${BASE}${name}.json`);
  if (!res.ok) throw new Error(`Failed to download ${name}: ${res.status}`);
  return res.json();
}

function refName(ref) {
  return ref.split('/').pop();
}

function collect(spec, roots) {
  const all = spec.components.schemas;
  const out = {};
  const visit = (name) => {
    if (out[name]) return;
    if (!all[name]) throw new Error(`Schema ${name} not found`);
    out[name] = all[name];
    const walk = (node) => {
      if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
          if (k === '$ref' && typeof v === 'string') visit(refName(v));
          else walk(v);
        }
      }
    };
    walk(all[name]);
  };
  roots.forEach(visit);
  return out;
}

const retrieved = new Date().toISOString().slice(0, 10);

const wxcc = await load('webex-contact-center');
const wxccRoots = ['CreateTaskRequestV2', 'CreateTaskResponse', 'TaskMessageRequest', 'TaskMessageResponse'];
await writeFile(
  path.join(outDir, 'wxcc-schemas.json'),
  JSON.stringify({ source: `${BASE}webex-contact-center.json`, retrieved, components: { schemas: collect(wxcc, wxccRoots) } }, null, 2)
);

const msg = await load('webex-messaging');
const op = msg.paths['/messages/{messageId}'].get;
const ref = op.responses['200'].content['application/json'].schema.$ref;
const messageName = ref ? refName(ref) : null;
if (!messageName) throw new Error('Get Message Details 200 response is not a $ref');
await writeFile(
  path.join(outDir, 'webex-schemas.json'),
  JSON.stringify({ source: `${BASE}webex-messaging.json`, retrieved, messageSchema: messageName, components: { schemas: collect(msg, [messageName]) } }, null, 2)
);
console.log('schemas written');
