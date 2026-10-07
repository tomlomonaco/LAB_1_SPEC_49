import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => JSON.parse(readFileSync(path.join(dir, name), 'utf8'));

const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: true });
addFormats(ajv);

const wxcc = read('wxcc-schemas.json');
const webex = read('webex-schemas.json');
ajv.addSchema({ $id: 'wxcc', components: wxcc.components }, 'wxcc');
ajv.addSchema({ $id: 'webex', components: webex.components }, 'webex');

function make(root, name) {
  const validate = ajv.getSchema(`${root}#/components/schemas/${name}`);
  if (!validate) throw new Error(`Schema not found: ${root}/${name}`);
  // Error details never include data values, so results are safe to log.
  return (body) => {
    const valid = validate(body);
    return { valid, errors: valid ? [] : validate.errors.map((e) => `${e.instancePath || '/'} ${e.message}`) };
  };
}

export const validateCreateTaskRequest = make('wxcc', 'CreateTaskRequestV2');
export const validateCreateTaskResponse = make('wxcc', 'CreateTaskResponse');
export const validateAppendRequest = make('wxcc', 'TaskMessageRequest');
export const validateAppendResponse = make('wxcc', 'TaskMessageResponse');
export const validateWebexMessage = make('webex', webex.messageSchema);
