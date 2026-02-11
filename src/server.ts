import express from 'express';
import { join } from 'node:path';
import { config } from './config.js';
import { health_router } from './routes/health.js';
import { generate_router } from './routes/generate.js';
import { gallery_router } from './routes/gallery.js';
import { wallet_art_router } from './routes/wallet_art.js';
import { block_art_router } from './routes/block_art.js';
import { request_logger } from './middleware/request_logger.js';
import { error_handler } from './middleware/error_handler.js';

export function create_server(): express.Express {
  const app = express();

  app.use(express.json());
  app.use(request_logger);

  app.use('/gallery', express.static(config.GALLERY_PATH));

  app.use(health_router);
  app.use(generate_router);
  app.use(gallery_router);
  app.use(wallet_art_router);
  app.use(block_art_router);

  app.use(error_handler);

  return app;
}
