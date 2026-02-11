import pg from 'pg';
import { config } from '../config.js';
import { logger } from './logger.js';
import { DatabaseError } from '../errors.js';

const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected pool error');
});

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug({ text: text.slice(0, 80), duration, rows: result.rowCount }, 'query');
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new DatabaseError('query', message);
  }
}

export async function initialize_database(): Promise<void> {
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await query(`
    CREATE TABLE IF NOT EXISTS art_pieces (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      source_type TEXT NOT NULL,
      source_data JSONB NOT NULL DEFAULT '{}',
      parameters JSONB NOT NULL DEFAULT '{}',
      svg_url TEXT NOT NULL DEFAULT '',
      png_url TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_art_pieces_created ON art_pieces (created_at DESC)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_art_pieces_source ON art_pieces (source_type)`);

  logger.info('Database initialized');
}

export async function shutdown_database(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}
