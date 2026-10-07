import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAppendRequest, validateAppendResponse, validateCreateTaskRequest, validateCreateTaskResponse, validateWebexMessage
} from '../../src/contracts/validators.js';
import { createTaskResponse, appendResponse } from '../fixtures/wxcc.js';
import { webexMessage } from '../fixtures/webex.js';

const message = { aliasId: '123e4567-e89b-12d3-a456-426614174000', text: 'hi', timestamp: 1732786800000 };

test('validators compile and accept fixture bodies', () => {
  assert.equal(validateCreateTaskRequest({
    origin: { id: 'a@example.com' }, destination: { id: 's@example.com', type: 'businessAddress' },
    channelType: 'customMessaging', channel: 'c', channelParams: { type: 'text', message }
  }).valid, true);
  assert.equal(validateAppendRequest({ mediaType: 'customMessaging', channelParams: { type: 'text', message } }).valid, true);
  assert.equal(validateCreateTaskResponse(createTaskResponse()).valid, true);
  assert.equal(validateAppendResponse(appendResponse()).valid, true);
  assert.equal(validateWebexMessage(webexMessage()).valid, true);
});

test('validators reject contract violations without echoing data values', () => {
  const r = validateCreateTaskResponse({ meta: { orgId: 'not-a-uuid' }, data: {} });
  assert.equal(r.valid, false);
  assert.equal(JSON.stringify(r.errors).includes('not-a-uuid'), false);
  assert.equal(validateAppendRequest({ mediaType: 'customMessaging', channelParams: { type: 'text', message: { ...message, unexpected: true } } }).valid, false);
  assert.equal(validateCreateTaskRequest({ origin: { id: 'x' } }).valid, false);
});

