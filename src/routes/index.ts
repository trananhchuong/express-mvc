import { Router } from 'express';
import { getHome } from '../controllers/home.controller.js';
import { getCharts } from '../controllers/charts.controller.js';
import { getTables } from '../controllers/tables.controller.js';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';

export const router = Router();

router.get('/', getHome);
router.get('/charts', getCharts);
router.get('/tables', getTables);
router.use(healthRouter);
router.use(authRouter);
