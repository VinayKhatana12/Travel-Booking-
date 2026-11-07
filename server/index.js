import { createApp } from './app.js';
import { env } from './config.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`✈️  Wanderly API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Set PORT in server/.env and retry.`);
  } else {
    console.error('Failed to start server:', err.message);
  }
  process.exit(1);
});

// Graceful shutdown
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`\n${signal} received — shutting down.`);
    server.close(() => process.exit(0));
  });
}
