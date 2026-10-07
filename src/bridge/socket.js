// Bridge WebSocket consumer (hook-to-socket-spec.md): one socket per pair, FIFO processing,
// bounded backoff reconnect, takeover handling, no replay assumed.
import { log } from '../log.js';

export function createBridgeClient({ wsBaseUrl, pairId, reconnectDelayMs, reconnectMaxDelayMs, onFrame, WebSocketImpl = globalThis.WebSocket }) {
  const url = `${wsBaseUrl}/v1/pairs/${encodeURIComponent(pairId)}/socket`;
  let ws = null;
  let ready = false;
  let stopped = false;
  let attempt = 0;
  let timer = null;
  let tail = Promise.resolve();

  const nextDelay = () => Math.min(reconnectMaxDelayMs, reconnectDelayMs * 2 ** attempt);

  function enqueue(raw) {
    tail = tail.then(async () => {
      try {
        await onFrame(raw);
      } catch (error) {
        log('error', 'bridge.frame', 'failure', {}, error);
      }
    });
    return tail;
  }

  function connect() {
    if (stopped) return;
    ws = new WebSocketImpl(url);
    ws.addEventListener('open', () => {
      ready = true;
      const reconnected = attempt > 0;
      attempt = 0;
      log('info', reconnected ? 'bridge.reconnect' : 'bridge.connect', 'success', { pairId });
    });
    ws.addEventListener('message', (event) => {
      const raw = typeof event.data === 'string' ? event.data : String(event.data);
      enqueue(raw);
    });
    ws.addEventListener('error', () => {
      log('warn', 'bridge.socket-error', 'failure', { pairId });
    });
    ws.addEventListener('close', (event) => {
      const wasReady = ready;
      ready = false;
      if (stopped) return;
      if (/takeover|replaced/i.test(event.reason ?? '')) {
        log('error', 'bridge.takeover', 'failure', { pairId, code: event.code }, new Error('Connection taken over by another consumer; not reconnecting'));
        return;
      }
      const delay = nextDelay();
      attempt += 1;
      log('warn', 'bridge.disconnect', wasReady ? 'failure' : 'skipped', { pairId, code: event.code, retryInMs: delay });
      timer = setTimeout(connect, delay);
      timer.unref?.();
    });
  }

  return {
    url,
    start: connect,
    isReady: () => ready,
    idle: () => tail,
    async stop() {
      stopped = true;
      ready = false;
      clearTimeout(timer);
      if (ws && ws.readyState <= 1) ws.close(1000, 'shutdown');
      await tail;
    }
  };
}
