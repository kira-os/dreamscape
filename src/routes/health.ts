import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'dreamscape',
    timestamp: new Date().toISOString(),
  });
});

export { router as health_router };
