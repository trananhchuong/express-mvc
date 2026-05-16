import { Router } from 'express';
import { getHome } from '../controllers/home.controller.js';
import { healthRouter } from './health.routes.js';

export const router = Router();

router.get('/', getHome);
router.use(healthRouter);
