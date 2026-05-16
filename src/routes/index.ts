import { Router } from 'express';
import { healthRouter } from './health.routes.js';

export const router = Router();

router.get('/', (_req, res) => {
  res.json({ message: 'Welcome to express-mvc' });
});

router.use(healthRouter);
