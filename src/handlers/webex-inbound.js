import { randomUUID } from 'node:crypto';
import { log } from '../log.js';
import { DELIVERY_FAILED_TEXT } from '../messages.js';
import { reject } from './rejection.js';

const MAX_TEXT = 20000;

// Text-only validation of a fetched Webex message (FR-005, FR-006).
export function validateInboundMessage(message) {
  const nonEmpty = (v) => Array.isArray(v) && v.length > 0;
  if (nonEmpty(message.files) || nonEmpty(message.attachments)) return { ok: false, reason: 'non-text' };
  if (typeof message.text !== 'string' || message.text.trim() === '') return { ok: false, reason: 'empty' };
  if (message.text.length > MAX_TEXT) return { ok: false, reason: 'non-text' };
  const parsed = Date.parse(message.created);
  return {
    ok: true,
    value: {
      messageId: message.id,
      text: message.text,
      timestamp: Number.isNaN(parsed) ? Date.now() : parsed,
      aliasId: randomUUID()
    }
  };
}

export function createWebexInbound({ config, registry, store, webex, wxcc }) {
  const businessAddress = config.wxcc.businessAddress.toLowerCase();
  const botEmail = config.webex.botEmail.toLowerCase();

  async function notify(roomId, text, operation) {
    try {
      await webex.postMessage(roomId, text);
    } catch (error) {
      log('error', operation, 'failure', { roomId }, error);
    }
  }

  // Returns a rejection reason when the sender must be ignored (FR-007).
  function senderGuard(email) {
    const e = typeof email === 'string' ? email.toLowerCase() : '';
    if (e && e === businessAddress) return 'business-address-sender';
    if (e && e === botEmail) return 'bot-sender';
    return null;
  }

  async function forward(conv, msg, ids) {
    try {
      await wxcc.appendMessage(conv.taskId, msg);
      log('info', 'task.append', 'success', { ...ids, taskId: conv.taskId });
    } catch (error) {
      log('error', 'task.append', 'failure', { ...ids, taskId: conv.taskId }, error);
      await notify(conv.roomId, DELIVERY_FAILED_TEXT, 'webex.delivery-failed-notice');
    }
  }

  async function handleWebexMessage(ev) {
    const data = ev.payload.data;
    const roomId = data.roomId;
    const ids = { bridgeEventId: ev.bridge.eventId, messageId: data.id, roomId };

    if (!registry.claim(`webex:message:${data.id}`)) {
      log('warn', 'webex.message', 'duplicate', { ...ids, key: `webex:message:${data.id}` });
      return;
    }
    const early = senderGuard(data.personEmail);
    if (early) return reject(early, ids, { operation: 'webex.ignore' });

    let message;
    try {
      message = await webex.getMessage(data.id);
    } catch (error) {
      // The client logged the API failure; this entry adds bridge/room correlation. No retry (FR-011d).
      log('error', 'webex.message', 'failure', ids, error);
      return;
    }
    const late = senderGuard(message.personEmail ?? data.personEmail);
    if (late) return reject(late, ids, { operation: 'webex.ignore' });

    const checked = validateInboundMessage(message);
    if (!checked.ok) return reject(checked.reason, ids);
    const msg = checked.value;
    const personEmail = message.personEmail ?? data.personEmail;

    const conv = store.get(roomId);
    if (conv?.state === 'active') return forward(conv, msg, ids);
    if (conv) {
      store.enqueue(roomId, msg);
      log('info', 'task.queue', 'success', { ...ids, taskId: conv.taskId, queued: conv.queue.length });
      return;
    }

    store.begin(roomId, personEmail);
    try {
      const { taskId } = await wxcc.createTask({ personEmail, ...msg });
      store.setPending(roomId, taskId);
      log('info', 'task.pending', 'success', { ...ids, taskId });
    } catch (error) {
      store.remove(roomId);
      log('error', 'task.create', 'failure', ids, error);
      await notify(roomId, DELIVERY_FAILED_TEXT, 'webex.delivery-failed-notice');
    }
  }

  return { handleWebexMessage, forward, notify };
}
