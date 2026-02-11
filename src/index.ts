import { mkdir } from 'node:fs/promises';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { initialize_database, shutdown_database } from './lib/database.js';
import { create_server } from './server.js';

async function main(): Promise<void> {
  logger.info({ env: config.NODE_ENV }, 'Starting Dreamscape');

  await mkdir(config.GALLERY_PATH, { recursive: true });
  await initialize_database();

  const app = create_server();
  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'Dreamscape server running');
  });

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down');
    server.close();
    await shutdown_database();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

main().catch((err) => {
  logger.fatal({ err }, 'Fatal startup error');
  process.exit(1);
});
