import { createApp } from './app.js';
import { ConfigError, loadConfig } from './config.js';
import { log } from './log.js';

process.on('unhandledRejection', (reason) => {
  log('error', 'process.unhandled-rejection', 'failure', {}, reason instanceof Error ? reason : new Error(String(reason)));
});
process.on('uncaughtException', (error) => {
  log('error', 'process.uncaught-exception', 'failure', {}, error);
  process.exit(1);
});

let config;
try {
  config = loadConfig();
  log('info', 'config.validate', 'success', {});
} catch (error) {
  log('error', 'config.validate', 'failure', { variables: error instanceof ConfigError ? error.variables : undefined }, error);
  process.exit(1);
}

const app = createApp(config);
await app.start();
log('info', 'ready', 'success', { pairId: config.bridge.pairId });

async function shutdown(signal) {
  log('info', 'shutdown', 'success', { signal });
  await app.stop();
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
