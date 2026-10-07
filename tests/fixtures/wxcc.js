// Production-shaped WxCC fixtures (webhooks-cc.md, bring-your-own-custom-messaging-channel.md, WxCC OpenAPI).
export const ORG_ID = 'cb5901fb-ab66-4377-a7bc-5f0b21896952';
export const TASK_ID = '044ea619-a0ad-41a3-9ed9-c2563a9bd6b7';
export const BUSINESS_ADDRESS = 'support@channel.example';
export const CHANNEL = 'my-custom-channel';

const base = (type, id, data) => ({
  id, specversion: '1.0', type, source: '/com/cisco/wxcc/ed9357d0-3f5d-4c6a-a4fd-111111111111',
  comciscoorgid: ORG_ID, comciscotimestamp: 1779785508649, datacontenttype: 'application/json', data
});

const common = (taskId, direction = 'INBOUND') => ({
  taskId, origin: 'customer@example.com', destination: BUSINESS_ADDRESS, direction,
  channelType: 'customMessaging', channel: CHANNEL, createdTime: 1779785508649
});

export const taskNew = ({ taskId = TASK_ID, direction = 'INBOUND', id = 'evt-task-new-1' } = {}) =>
  base('task:new', id, common(taskId, direction));

export const taskFailed = ({ taskId = TASK_ID, id = 'evt-task-failed-1', reason = 'CONVERSATION_ALREADY_OPEN' } = {}) =>
  base('task:failed', id, {
    ...common(taskId), mediaMgr: 'digitalmm', reason, errorMessage: 'Conversation is already open', failureType: 'failed'
  });

export const taskEnded = ({ taskId = TASK_ID, direction = 'INBOUND', id = 'evt-task-ended-1' } = {}) =>
  base('task:ended', id, { ...common(taskId, direction), terminatingParty: 'Agent', reason: 'Agent left' });

export const inboundAppended = ({ taskId = TASK_ID, id = 'evt-inbound-1', aliasId = '90a896bc-5eb5-4d15-8e11-f62e99751c21' } = {}) =>
  base('task-message:appended', id, {
    ...common(taskId), messageDirection: 'INBOUND', eventDetails: 'Appended Message to chat successfully.',
    channelParams: { type: 'text', message: { aliasId, text: 'customer text', timestamp: 1779785508649 } }, reason: null, errorMessage: null
  });

export const outboundAppended = ({
  taskId = TASK_ID, id = '11de1010-a89c-4f3f-9dc1-9497164d3268', aliasId = '5690d7d9-b1a7-4e5b-9568-ca867a26eb49',
  text = 'Hello, I am reviewing your request now.', senderType = 'agent', attachments = []
} = {}) =>
  base('task-message:appended', id, {
    taskId, origin: 'customer@example.com', destination: BUSINESS_ADDRESS, messageDirection: 'OUTBOUND', senderType,
    ...(senderType === 'agent' ? { senderId: '5f2ecb3f-1a83-41a9-9b70-c3f8b53b25a0' } : {}),
    channelType: 'customMessaging', channel: CHANNEL,
    channelParams: { type: attachments.length ? 'text-with-attachments' : 'text', message: { aliasId, text, timestamp: 1779785586332, attachments } },
    createdTime: 1779785586332
  });

export const appendFailed = ({ taskId = TASK_ID, id = 'evt-append-failed-1' } = {}) =>
  base('task-message:append-failed', id, {
    ...common(taskId), messageDirection: 'INBOUND', eventDetails: null, channelParams: null,
    reason: 'INVALID_CONTENT', errorMessage: 'The maximum number of attachments allowed is 1.'
  });

export const createTaskResponse = (taskId = TASK_ID) => ({ meta: { orgId: ORG_ID }, data: { id: taskId } });
export const appendResponse = (id = '90a896bc-5eb5-4d15-8e11-f62e99751c21') => ({ meta: { orgId: ORG_ID }, data: { id } });
export const tokenResponse = (extra = {}) => ({ access_token: 'FAKE_ACCESS_TOKEN', expires_in: 3600, token_type: 'Bearer', ...extra });
export const errorBodies = {
  400: { message: 'Bad Request' }, 401: { message: 'Unauthorized, Token is Invalid' },
  429: { message: 'Too Many Requests' }, 500: { message: 'Internal Server Error' }
};
