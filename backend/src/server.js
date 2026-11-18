import { createServer } from 'node:http';
import { getEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { createApp } from './app.js';

const env = getEnv();
await connectDatabase(env.MONGODB_URI).catch((error) => {
  console.error('MongoDB connection failed; API was not started. Verify MONGODB_URI and database availability.', {
    name: error.name,
  });
  process.exitCode = 1;
});
if (process.exitCode === 1) process.exit();
const server = createServer(createApp(env));

server.on('error', (error) => {
  console.error('HTTP server failed to start or stopped unexpectedly', { code: error.code || 'unknown' });
  process.exitCode = 1;
});
server.listen(env.PORT, () => console.info(`Aurelia Grand API listening on port ${env.PORT} (${env.NODE_ENV})`));

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`${signal} received; shutting down`);
  server.close(async (error) => {
    if (error) {
      console.error('HTTP server shutdown failed', error);
      process.exitCode = 1;
    }
    try {
      await disconnectDatabase();
    } catch (disconnectError) {
      console.error('Database shutdown failed', disconnectError);
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection; shutting down', { name: error?.name || 'Error' });
  process.exitCode = 1;
  void shutdown('unhandledRejection');
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception; shutting down', { name: error.name });
  process.exitCode = 1;
  void shutdown('uncaughtException');
});
