// Vendors verbatim OpenAPI component schemas (with every transitive $ref target) from the
// official published specs: https://github.com/webex/webex-openapi-specs/tree/main/public-spec
// Usage: node scripts/extract-schemas.js          (write src/contracts/*.json)
//        node scripts/extract-schemas.js --check  (fail if the vendored files differ from upstream)
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://raw.githubusercontent.com/webex/webex-openapi-specs/main/public-spec/';
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'contracts');
const check = process.argv.includes('--check');

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
const drift = [];

// Writes the extract, or in --check mode compares it with the vendored file (ignoring the retrieval date).
async function emit(file, doc) {
  const target = path.join(outDir, file);
  if (!check) return writeFile(target, JSON.stringify(doc, null, 2));
  const current = JSON.parse(await readFile(target, 'utf8'));
  if (JSON.stringify({ ...current, retrieved: '' }) !== JSON.stringify({ ...doc, retrieved: '' })) drift.push(file);
}

const wxcc = await load('webex-contact-center');
const wxccRoots = ['CreateTaskRequestV2', 'CreateTaskResponse', 'TaskMessageRequest', 'TaskMessageResponse'];
await emit('wxcc-schemas.json', { source: `${BASE}webex-contact-center.json`, retrieved, components: { schemas: collect(wxcc, wxccRoots) } });

const msg = await load('webex-messaging');
const op = msg.paths['/messages/{messageId}'].get;
const ref = op.responses['200'].content['application/json'].schema.$ref;
const messageName = ref ? refName(ref) : null;
if (!messageName) throw new Error('Get Message Details 200 response is not a $ref');
await emit('webex-schemas.json', { source: `${BASE}webex-messaging.json`, retrieved, messageSchema: messageName, components: { schemas: collect(msg, [messageName]) } });

if (check) {
  if (drift.length) {
    console.error(`Schema drift vs upstream: ${drift.join(', ')}. Run npm run extract-schemas.`);
    process.exit(1);
  }
  console.log('schemas match upstream');
} else {
  console.log('schemas written');
}
