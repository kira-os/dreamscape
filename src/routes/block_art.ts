import { Router } from 'express';
import { z } from 'zod';
import * as chain_reader from '../services/chain_reader.js';
import { map_blocks_to_visuals } from '../services/data_mapper.js';
import { render_to_svg, render_to_png } from '../services/renderer.js';
import * as gallery_service from '../services/gallery_service.js';
import type { ArtMetadata } from '../types.js';

const router = Router();

const query_schema = z.object({
  range: z.coerce.number().int().min(1).max(50).default(5),
  style: z.enum(['geometric', 'organic', 'network', 'fractal', 'wave']).default('geometric'),
  width: z.coerce.number().int().min(256).max(4096).default(1920),
  height: z.coerce.number().int().min(256).max(4096).default(1080),
});

router.get('/api/block/:slot', async (req, res, next) => {
  try {
    const slot_str = req.params['slot'];
    if (slot_str === undefined) {
      res.status(400).json({ error: { type: 'InvalidInput', message: 'Missing block slot' } });
      return;
    }

    const slot = parseInt(slot_str, 10);
    if (Number.isNaN(slot) || slot < 0) {
      res.status(400).json({ error: { type: 'InvalidInput', message: 'Invalid slot number' } });
      return;
    }

    const query = query_schema.parse(req.query);
    const start = Date.now();

    const block_range = { start: slot, end: slot + query.range - 1 };
    const source_data = { block_range };
    const { blocks, transactions } = await chain_reader.read_chain_data(source_data);
    const parameters = map_blocks_to_visuals(blocks, transactions, query.style, query.width, query.height);

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
      `Block #${slot}${query.range > 1 ? `-${slot + query.range - 1}` : ''}`,
      `Generated from Solana blocks ${slot} to ${slot + query.range - 1}`,
      'block',
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

export { router as block_art_router };
