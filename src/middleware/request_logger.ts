import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

export function request_logger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({ method: req.method, url: req.url, status: res.statusCode, duration: Date.now() - start });
  });
  next();
}
