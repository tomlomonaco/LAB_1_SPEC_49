import { createServer } from 'node:http';
import { log } from './log.js';

// GET /ready -> 200 only while the bridge socket is open (hook-to-socket-spec.md "Security and Operations").
export function createReadinessServer({ isReady, port }) {
  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/ready') {
      const ready = isReady();
      res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ready }));
      return;
    }
    res.writeHead(404).end();
  });
  return {
    server,
    listen: () => new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, () => {
        log('info', 'readiness.listen', 'success', { port: server.address().port });
        resolve(server.address().port);
      });
    }),
    close: () => new Promise((resolve) => server.close(() => resolve()))
  };
}
