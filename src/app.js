import { parseEnvelope } from './bridge/envelope.js';
import { createBridgeClient } from './bridge/socket.js';
import { classify } from './events/classify.js';
import { createWebexClient } from './clients/webex.js';
import { createWxccAuth } from './clients/wxcc-auth.js';
import { createWxccClient } from './clients/wxcc.js';
import { createDispatcher } from './handlers/index.js';
import { reject } from './handlers/rejection.js';
import { log } from './log.js';
import { createReadinessServer } from './readiness.js';
import { createRegistry } from './state/idempotency.js';
import { createConversationStore } from './state/conversations.js';

// Wires the validated config into the running service.
export function createApp(config, overrides = {}) {
  const registry = createRegistry();
  let dispatcher;
  const store = createConversationStore({
    pendingTimeoutMs: config.service.pendingTaskTimeoutMs,
    onTimeout: (conv) => dispatcher.handlePendingTimeout(conv).catch((error) => log('error', 'task.pending-timeout', 'failure', { roomId: conv.roomId }, error))
  });
  const webex = overrides.webex ?? createWebexClient({ rootUrl: config.webex.rootUrl, botToken: config.webex.botToken });
  const auth = createWxccAuth({
    tokenUrl: config.wxcc.tokenUrl, clientId: config.wxcc.clientId,
    clientSecret: config.wxcc.clientSecret, refreshToken: config.wxcc.refreshToken
  });
  const wxcc = overrides.wxcc ?? createWxccClient({
    rootUrl: config.wxcc.rootUrl, auth, channelName: config.wxcc.channelName, businessAddress: config.wxcc.businessAddress
  });
  dispatcher = createDispatcher({ config, registry, store, webex, wxcc });

  // Processes one raw bridge frame: envelope -> classification -> handler.
  async function handleFrame(raw) {
    const parsed = parseEnvelope(raw, config.bridge.pairId);
    if (!parsed.ok) {
      reject(parsed.reason, { bridgeEventId: parsed.bridgeEventId, bridgeReceivedAt: parsed.receivedAt, detail: parsed.detail }, { level: 'error', operation: 'bridge.envelope' });
      return;
    }
    const bridgeKey = `bridge:${config.bridge.pairId}:${parsed.envelope.eventId}`;
    if (!registry.claim(bridgeKey)) {
      log('warn', 'bridge.frame', 'duplicate', { bridgeEventId: parsed.envelope.eventId, bridgeReceivedAt: parsed.envelope.receivedAt, key: bridgeKey });
      return;
    }
    const classified = classify(parsed.envelope);
    log('info', 'routing.classify', 'success', {
      bridgeEventId: classified.bridge.eventId, bridgeReceivedAt: classified.bridge.receivedAt, source: classified.source, kind: classified.kind, direction: classified.direction
    });
    try {
      await dispatcher.dispatch(classified);
    } catch (error) {
      log('error', 'routing.dispatch', 'failure', { bridgeEventId: classified.bridge.eventId, kind: classified.kind }, error);
    }
  }

  // Frames are processed strictly one at a time, in arrival order (hook-to-socket FIFO guarantee).
  let tail = Promise.resolve();
  function processFrame(raw) {
    tail = tail.then(() => handleFrame(raw)).catch((error) => log('error', 'bridge.frame', 'failure', {}, error));
    return tail;
  }

  const bridge = createBridgeClient({ ...config.bridge, onFrame: processFrame, WebSocketImpl: overrides.WebSocketImpl });
  const readiness = createReadinessServer({ isReady: bridge.isReady, port: config.service.readinessPort });

  return {
    registry, store, bridge, readiness, processFrame,
    async start() {
      await readiness.listen();
      bridge.start();
    },
    async stop() {
      await bridge.stop();
      await readiness.close();
    }
  };
}

