import { Router } from 'express';
import { getHome } from '../controllers/home.controller.js';
import { getCharts } from '../controllers/charts.controller.js';
import { getTables } from '../controllers/tables.controller.js';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { productRouter } from './product.routes.js';
import { orderRouter } from './order.routes.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { shopRouter } from './shop.routes.js';

export const router = Router();

// unguarded
router.use(healthRouter);
router.use(authRouter);
router.use(shopRouter);

// protected admin routes
router.use(requireAuth);
router.get('/', getHome);
router.get('/charts', getCharts);
router.get('/tables', getTables);
router.use(userRouter);
router.use(productRouter);
router.use(orderRouter);
