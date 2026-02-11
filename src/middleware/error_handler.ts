import type { Request, Response, NextFunction } from 'express';
import { DreamscapeError } from '../errors.js';
import { logger } from '../lib/logger.js';

export function error_handler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof DreamscapeError) {
    res.status(err.status_code).json({
      error: { type: err.name, message: err.message },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: { type: 'InternalError', message: 'An unexpected error occurred' },
  });
}
