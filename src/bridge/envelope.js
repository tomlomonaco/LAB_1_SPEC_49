// Bridge envelope validation per hook-to-socket-spec.md ("Websocket Event Contract").
export function parseEnvelope(raw, pairId) {
  let value = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return { ok: false, reason: 'malformed-envelope', detail: 'invalid JSON' };
    }
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, reason: 'malformed-envelope', detail: 'envelope is not an object' };
  }
  const { pairId: pid, eventId, receivedAt, contentType, payload } = value;
  const detail = (d) => ({ ok: false, reason: 'malformed-envelope', detail: d, bridgeEventId: typeof eventId === 'string' ? eventId : undefined, receivedAt: typeof receivedAt === 'string' ? receivedAt : undefined });
  if (pid !== pairId) return detail('pairId mismatch');
  if (typeof eventId !== 'string' || eventId === '') return detail('missing eventId');
  if (typeof receivedAt !== 'string' || receivedAt === '') return detail('missing receivedAt');
  if (contentType !== 'application/json') return detail('unsupported contentType');
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return detail('payload is not an object');
  return { ok: true, envelope: { pairId: pid, eventId, receivedAt, contentType, payload } };
}
