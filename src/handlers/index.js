import { reject } from './rejection.js';
import { createWebexInbound } from './webex-inbound.js';
import { createWxccEvents } from './wxcc-events.js';

// Routes a classified event to its handler.
export function createDispatcher({ config, registry, store, webex, wxcc }) {
  const inbound = createWebexInbound({ config, registry, store, webex, wxcc });
  const events = createWxccEvents({ registry, store, webex, inbound });
  const routes = {
    'webex.message.created': inbound.handleWebexMessage,
    'wxcc.task.new': events.handleTaskNew,
    'wxcc.task.failed': events.handleTaskFailed,
    'wxcc.task.ended': events.handleTaskEnded,
    'wxcc.message.outbound': events.handleOutbound,
    'wxcc.message.inbound': events.handleInboundEcho,
    'wxcc.message.append-failed': events.handleAppendFailed
  };
  return {
    handlePendingTimeout: events.handlePendingTimeout,
    async dispatch(classified) {
      const handler = routes[classified.kind];
      if (!handler) {
        reject(classified.reason ?? 'unsupported-event', { bridgeEventId: classified.bridge.eventId, source: classified.source });
        return;
      }
      await handler(classified);
    }
  };
}
