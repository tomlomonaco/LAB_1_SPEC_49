// Production-shaped Webex fixtures (shapes from webhooks.md and the Webex Messaging OpenAPI). Placeholder values only.
export const WEBHOOK_ID = 'Y2lzY29zcGFyazovL3VzL1dFQkhPT0svZXhhbXBsZQ';
export const ROOM_ID = 'Y2lzY29zcGFyazovL3VzL1JPT00vZXhhbXBsZS1yb29t';
export const PERSON_ID = 'Y2lzY29zcGFyazovL3VzL1BFT1BMRS9leGFtcGxlLXBlcnNvbg';
export const CUSTOMER_EMAIL = 'customer@example.com';

export function messageCreatedWebhook({ messageId = 'MSG_0001', roomId = ROOM_ID, personEmail = CUSTOMER_EMAIL } = {}) {
  return {
    id: WEBHOOK_ID,
    name: 'New message webhook',
    resource: 'messages',
    event: 'created',
    filter: `roomId=${roomId}`,
    orgId: 'OTZhYmMyYWEtM2RjYy0xMWU1LWExNTItZmUzNDgxOWNkYzlh',
    createdBy: PERSON_ID,
    appId: 'Y2lzY29zcGFyazovL3VzL0FQUExJQ0FUSU9OL2V4YW1wbGU',
    ownedBy: 'creator',
    status: 'active',
    actorId: PERSON_ID,
    data: { id: messageId, roomId, personId: PERSON_ID, personEmail, created: '2026-10-07T20:00:00.000Z' }
  };
}

export function webexMessage({ id = 'MSG_0001', roomId = ROOM_ID, personEmail = CUSTOMER_EMAIL, text = 'Hello, I need help with my order.', extra = {} } = {}) {
  return {
    id, roomId, roomType: 'direct', text, personId: PERSON_ID, personEmail, created: '2026-10-07T20:00:00.000Z', ...extra
  };
}

export const webexCreateMessageResponse = (roomId = ROOM_ID, text = 'ok') =>
  webexMessage({ id: 'MSG_OUT', roomId, personEmail: 'bot@webex.bot', text });
