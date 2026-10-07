// Bridge envelope fixtures (hook-to-socket-spec.md "Websocket Event Contract").
export const PAIR_ID = 'test_pair';
let counter = 0;

export function wrap(payload, overrides = {}) {
  counter += 1;
  return JSON.stringify({
    pairId: PAIR_ID, eventId: `evt_${String(counter).padStart(6, '0')}`, receivedAt: '2026-10-07T20:00:00Z',
    contentType: 'application/json', payload, ...overrides
  });
}

export const malformed = {
  badJson: '{not json',
  notObject: '[]',
  wrongPair: (payload) => wrap(payload, { pairId: 'other_pair' }),
  missingEventId: (payload) => JSON.stringify({ pairId: PAIR_ID, receivedAt: '2026-10-07T20:00:00Z', contentType: 'application/json', payload }),
  payloadNotObject: wrap('x')
};
