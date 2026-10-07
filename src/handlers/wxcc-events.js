import { log } from '../log.js';
import { CHAT_ENDED_TEXT, DELIVERY_FAILED_TEXT } from '../messages.js';
import { reject } from './rejection.js';

export function createWxccEvents({ registry, store, webex, inbound }) {
  const idsOf = (ev) => ({ bridgeEventId: ev.bridge.eventId, wxccEventId: ev.payload.id, taskId: ev.payload.data.taskId });

  // Claims a task-scoped lifecycle key; returns false (and logs) when already handled.
  function claimLifecycle(ev) {
    const key = `wxcc:task:${ev.payload.type}:${ev.payload.data.taskId}`;
    if (registry.claim(key)) return true;
    log('warn', `wxcc.${ev.payload.type}`, 'duplicate', { ...idsOf(ev), key });
    return false;
  }

  function conversationFor(ev) {
    const conv = store.byTask(ev.payload.data.taskId);
    if (!conv) reject('unknown-task', idsOf(ev));
    return conv;
  }

  async function handleTaskNew(ev) {
    if (!claimLifecycle(ev)) return;
    const conv = conversationFor(ev);
    if (!conv) return;
    store.activate(conv.roomId);
    log('info', 'task.active', 'success', { ...idsOf(ev), roomId: conv.roomId });
    for (const msg of store.drain(conv.roomId)) {
      await inbound.forward(conv, msg, { roomId: conv.roomId, messageId: msg.messageId });
    }
  }

  async function handleTaskFailed(ev) {
    if (!claimLifecycle(ev)) return;
    const conv = conversationFor(ev);
    if (!conv) return;
    const dropped = conv.queue.length;
    store.remove(conv.roomId);
    log('error', 'task.failed', 'failure', { ...idsOf(ev), roomId: conv.roomId, droppedMessages: dropped },
      Object.assign(new Error(ev.payload.data.errorMessage ?? 'task failed'), { reason: ev.payload.data.reason }));
    await inbound.notify(conv.roomId, DELIVERY_FAILED_TEXT, 'webex.delivery-failed-notice');
  }

  async function handleTaskEnded(ev) {
    if (!claimLifecycle(ev)) return;
    const conv = conversationFor(ev);
    if (!conv) return;
    store.remove(conv.roomId);
    log('info', 'task.ended', 'success', { ...idsOf(ev), roomId: conv.roomId });
    await inbound.notify(conv.roomId, CHAT_ENDED_TEXT, 'webex.chat-ended-notice');
    log('info', 'conversation.cleared', 'success', { roomId: conv.roomId, taskId: conv.taskId });
  }

  async function handleOutbound(ev) {
    const d = ev.payload.data;
    const message = d.channelParams?.message;
    const keys = [`wxcc:event:${ev.payload.id}`];
    if (typeof message?.aliasId === 'string') keys.push(`wxcc:msg:${d.taskId}:${message.aliasId}`);
    if (keys.some((k) => registry.has(k))) {
      log('warn', 'routing.outbound', 'duplicate', { ...idsOf(ev), keys });
      return;
    }
    keys.forEach((k) => registry.claim(k));

    const conv = conversationFor(ev);
    if (!conv) return;
    const text = typeof message?.text === 'string' ? message.text : '';
    const attachments = Array.isArray(message?.attachments) ? message.attachments.length : 0;
    if (text.trim() === '') return reject(attachments ? 'non-text' : 'empty', idsOf(ev));
    if (attachments) log('warn', 'routing.outbound', 'skipped', { ...idsOf(ev), droppedAttachments: attachments, note: 'attachments are not supported' });
    try {
      await webex.postMessage(conv.roomId, text);
      log('info', 'routing.outbound', 'success', { ...idsOf(ev), roomId: conv.roomId, senderType: d.senderType, textLength: text.length });
    } catch (error) {
      log('error', 'routing.outbound', 'failure', { ...idsOf(ev), roomId: conv.roomId }, error);
    }
  }

  async function handleInboundEcho(ev) {
    log('info', 'routing.inbound-echo', 'skipped', { ...idsOf(ev), note: 'inbound task-message confirmation; never sent to Webex' });
  }

  async function handleAppendFailed(ev) {
    if (!registry.claim(`wxcc:event:${ev.payload.id}`)) {
      log('warn', 'wxcc.task-message:append-failed', 'duplicate', idsOf(ev));
      return;
    }
    const conv = conversationFor(ev);
    if (!conv) return;
    log('error', 'task.append', 'failure', { ...idsOf(ev), roomId: conv.roomId },
      Object.assign(new Error(ev.payload.data.errorMessage ?? 'append failed'), { reason: ev.payload.data.reason }));
    await inbound.notify(conv.roomId, DELIVERY_FAILED_TEXT, 'webex.delivery-failed-notice');
  }

  async function handlePendingTimeout(conv) {
    const dropped = conv.queue.length;
    store.remove(conv.roomId);
    log('error', 'task.pending-timeout', 'failure', { roomId: conv.roomId, taskId: conv.taskId, droppedMessages: dropped },
      Object.assign(new Error('task:new not received before timeout'), { reason: 'PENDING_TIMEOUT' }));
    await inbound.notify(conv.roomId, DELIVERY_FAILED_TEXT, 'webex.delivery-failed-notice');
  }

  return { handleTaskNew, handleTaskFailed, handleTaskEnded, handleOutbound, handleInboundEcho, handleAppendFailed, handlePendingTimeout };
}
