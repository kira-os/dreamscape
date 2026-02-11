import pino from 'pino';

export const logger = pino({
  name: 'dreamscape',
  level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
  transport: process.env['NODE_ENV'] !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});
