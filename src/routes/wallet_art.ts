import { Router } from 'express';
import { z } from 'zod';
import * as chain_reader from '../services/chain_reader.js';
import { map_blocks_to_visuals } from '../services/data_mapper.js';
import { render_to_svg, render_to_png } from '../services/renderer.js';
import * as gallery_service from '../services/gallery_service.js';
import type { ArtMetadata } from '../types.js';

const router = Router();

const query_schema = z.object({
  style: z.enum(['geometric', 'organic', 'network', 'fractal', 'wave']).default('network'),
  width: z.coerce.number().int().min(256).max(4096).default(1920),
  height: z.coerce.number().int().min(256).max(4096).default(1080),
});

router.get('/api/wallet/:address', async (req, res, next) => {
  try {
    const address = req.params['address'];
    if (address === undefined) {
      res.status(400).json({ error: { type: 'InvalidInput', message: 'Missing wallet address' } });
      return;
    }

    const query = query_schema.parse(req.query);
    const start = Date.now();

    const source_data = { wallet_address: address };
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
      `Wallet: ${address.slice(0, 8)}...`,
      `Generated from on-chain activity of ${address}`,
      'wallet',
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

export { router as wallet_art_router };
