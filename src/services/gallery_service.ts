import { randomUUID } from 'node:crypto';
import * as database from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { PieceNotFoundError } from '../errors.js';
import type { ArtPiece, GalleryListing, ChainDataInput, VisualParameters, ArtMetadata } from '../types.js';

export async function save_piece(
  title: string,
  description: string,
  source_type: ArtPiece['source_type'],
  source_data: ChainDataInput,
  parameters: VisualParameters,
  svg_url: string,
  png_url: string,
  metadata: ArtMetadata,
): Promise<ArtPiece> {
  const id = randomUUID();

  await database.query(
    `INSERT INTO art_pieces (id, title, description, source_type, source_data, parameters, svg_url, png_url, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id, title, description, source_type,
      JSON.stringify(source_data),
      JSON.stringify(parameters),
      svg_url, png_url,
      JSON.stringify(metadata),
    ],
  );

  logger.info({ id, title, source_type }, 'Art piece saved');

  return {
    id,
    title,
    description,
    source_type,
    source_data,
    parameters,
    svg_url,
    png_url,
    metadata,
    created_at: new Date().toISOString(),
  };
}

export async function get_piece(id: string): Promise<ArtPiece | null> {
  const result = await database.query<ArtPiece>(
    `SELECT * FROM art_pieces WHERE id = $1`,
    [id],
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return row === undefined ? null : row;
}

export async function list_gallery(
  source_type: string | null,
  limit: number,
  offset: number,
): Promise<{ pieces: GalleryListing[]; total: number }> {
  let count_sql = `SELECT COUNT(*) as count FROM art_pieces`;
  let list_sql = `SELECT id, title, source_type, parameters->>'style' as style, svg_url, png_url, created_at FROM art_pieces`;
  const params: unknown[] = [];

  if (source_type !== null) {
    count_sql += ` WHERE source_type = $1`;
    list_sql += ` WHERE source_type = $1`;
    params.push(source_type);
  }

  list_sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const [count_result, list_result] = await Promise.all([
    database.query<{ count: string }>(count_sql, source_type !== null ? [source_type] : []),
    database.query<GalleryListing>(list_sql, params),
  ]);

  const count_row = count_result.rows[0];
  const total = count_row !== undefined ? parseInt(count_row.count, 10) : 0;

  return {
    pieces: list_result.rows,
    total,
  };
}

export async function delete_piece(id: string): Promise<void> {
  const result = await database.query(
    `DELETE FROM art_pieces WHERE id = $1`,
    [id],
  );

  if (result.rowCount === 0) {
    throw new PieceNotFoundError(id);
  }

  logger.info({ id }, 'Art piece deleted');
}
