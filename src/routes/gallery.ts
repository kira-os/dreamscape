import { Router } from 'express';
import { z } from 'zod';
import * as gallery_service from '../services/gallery_service.js';
import { PieceNotFoundError } from '../errors.js';

const router = Router();

const list_query_schema = z.object({
  source_type: z.enum(['wallet', 'block', 'token', 'transaction', 'custom']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

router.get('/api/gallery', async (req, res, next) => {
  try {
    const query = list_query_schema.parse(req.query);
    const result = await gallery_service.list_gallery(
      query.source_type ?? null,
      query.limit,
      query.offset,
    );
    res.json({ pieces: result.pieces, total: result.total });
  } catch (err) {
    next(err);
  }
});

router.get('/api/gallery/:id', async (req, res, next) => {
  try {
    const id = req.params['id'];
    if (id === undefined) {
      throw new PieceNotFoundError('unknown');
    }

    const piece = await gallery_service.get_piece(id);
    if (piece === null) {
      throw new PieceNotFoundError(id);
    }

    res.json({ piece });
  } catch (err) {
    next(err);
  }
});

router.delete('/api/gallery/:id', async (req, res, next) => {
  try {
    const id = req.params['id'];
    if (id === undefined) {
      throw new PieceNotFoundError('unknown');
    }

    await gallery_service.delete_piece(id);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export { router as gallery_router };
