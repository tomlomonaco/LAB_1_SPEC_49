// Source -> type -> direction classification (contracts/bridge-envelope.md, contracts/wxcc-webhooks.md).
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v !== '';

export function classify(envelope) {
  const { payload, eventId, receivedAt } = envelope;
  const bridge = { eventId, receivedAt };
  const out = (source, kind, extra = {}) => ({ source, kind, bridge, payload, ...extra });

  const looksWebex = typeof payload.resource === 'string' && typeof payload.event === 'string' && isObj(payload.data);
  const looksWxcc = typeof payload.specversion === 'string' && typeof payload.type === 'string' && isObj(payload.data);

  if (looksWebex === looksWxcc) return out('unknown', 'unsupported', { reason: 'unknown-source' });

  if (looksWebex) {
    if (payload.resource !== 'messages' || payload.event !== 'created') {
      return out('webex', 'unsupported', { reason: 'unsupported-event' });
    }
    const d = payload.data;
    if (!isStr(d.id) || !isStr(d.roomId)) return out('webex', 'unsupported', { reason: 'malformed-payload' });
    return out('webex', 'webex.message.created');
  }

  const d = payload.data;
  const types = {
    'task:new': 'wxcc.task.new',
    'task:failed': 'wxcc.task.failed',
    'task:ended': 'wxcc.task.ended',
    'task-message:appended': 'wxcc.message',
    'task-message:append-failed': 'wxcc.message.append-failed'
  };
  const base = types[payload.type];
  if (!base) return out('wxcc', 'unsupported', { reason: 'unsupported-event' });
  if (!isStr(d.taskId)) return out('wxcc', 'unsupported', { reason: 'malformed-payload' });
  if (d.channelType !== undefined && d.channelType !== 'customMessaging') {
    return out('wxcc', 'unsupported', { reason: 'wrong-channel' });
  }

  if (base === 'wxcc.message') {
    if (!isStr(payload.id)) return out('wxcc', 'unsupported', { reason: 'malformed-payload' });
    const dir = d.messageDirection;
    if (dir === 'OUTBOUND') return out('wxcc', 'wxcc.message.outbound', { direction: dir });
    if (dir === 'INBOUND') return out('wxcc', 'wxcc.message.inbound', { direction: dir });
    return out('wxcc', 'unsupported', { reason: 'malformed-payload' });
  }
  if (base === 'wxcc.message.append-failed') {
    if (!isStr(payload.id)) return out('wxcc', 'unsupported', { reason: 'malformed-payload' });
    return out('wxcc', base, { direction: d.messageDirection });
  }
  // Lifecycle events: direction is data.direction. It is enforced for task:new only (spec Assumptions).
  if (base === 'wxcc.task.new' && d.direction !== 'INBOUND') {
    return out('wxcc', 'unsupported', { reason: 'wrong-direction', direction: d.direction });
  }
  return out('wxcc', base, { direction: d.direction });
}
