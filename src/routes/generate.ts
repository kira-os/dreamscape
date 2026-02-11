import { Router } from 'express';
import { z } from 'zod';
import * as chain_reader from '../services/chain_reader.js';
import { map_blocks_to_visuals } from '../services/data_mapper.js';
import { render_to_svg, render_to_png } from '../services/renderer.js';
import * as gallery_service from '../services/gallery_service.js';
import type { ArtMetadata, SourceType } from '../types.js';

const router = Router();

const generate_body_schema = z.object({
  title: z.string().min(1).max(200).default('Untitled'),
  description: z.string().max(1000).default(''),
  source_type: z.enum(['wallet', 'block', 'token', 'transaction', 'custom']).default('block'),
  wallet_address: z.string().min(32).max(44).optional(),
  block_start: z.coerce.number().int().positive().optional(),
  block_end: z.coerce.number().int().positive().optional(),
  token_mint: z.string().min(32).max(44).optional(),
  style: z.enum(['geometric', 'organic', 'network', 'fractal', 'wave']).default('geometric'),
  width: z.coerce.number().int().min(256).max(4096).default(1920),
  height: z.coerce.number().int().min(256).max(4096).default(1080),
});

router.post('/api/generate', async (req, res, next) => {
  try {
    const body = generate_body_schema.parse(req.body);
    const start = Date.now();

    const source_data = {
      wallet_address: body.wallet_address,
      block_range: body.block_start !== undefined && body.block_end !== undefined
        ? { start: body.block_start, end: body.block_end }
        : undefined,
      token_mint: body.token_mint,
    };

    const { blocks, transactions } = await chain_reader.read_chain_data(source_data);
    const parameters = map_blocks_to_visuals(blocks, transactions, body.style, body.width, body.height);

    const piece_id = crypto.randomUUID();
    const [svg_url, png_url] = await Promise.all([
      render_to_svg(parameters, piece_id),
      render_to_png(parameters, piece_id),
    ]);

    const metadata: ArtMetadata = {
      generation_time_ms: Date.now() - start,
      source_block_count: blocks.length,
      source_transaction_count: transactions.length,
      algorithm_version: '1.0.0',
      seed: parameters.palette.source_hash,
    };

    const piece = await gallery_service.save_piece(
      body.title,
      body.description,
      body.source_type,
      source_data,
      parameters,
      svg_url,
      png_url,
      metadata,
    );

    res.status(201).json({ piece });
  } catch (err) {
    next(err);
  }
});

export { router as generate_router };
