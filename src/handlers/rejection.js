import { log } from '../log.js';

export const REJECTION_REASONS = Object.freeze([
  'empty', 'non-text', 'malformed-envelope', 'malformed-payload', 'unsupported-event', 'unknown-source',
  'wrong-direction', 'wrong-channel', 'business-address-sender', 'bot-sender', 'unknown-task', 'duplicate'
]);

// Records a validation rejection (warn by default; error for malformed envelopes).
export function reject(reason, ids = {}, { level = 'warn', operation = 'validation.reject' } = {}) {
  if (!REJECTION_REASONS.includes(reason)) throw new Error(`Unknown rejection reason: ${reason}`);
  log(level, operation, 'rejected', { ...ids, reason });
}
