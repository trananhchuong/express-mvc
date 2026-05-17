import { Router } from 'express';
import { getOrders, getOrderDetail, postUpdateOrderStatus } from '../controllers/order.controller.js';

export const orderRouter = Router();

orderRouter.get('/admin/orders', getOrders);
orderRouter.get('/admin/orders/:id', getOrderDetail);
orderRouter.post('/admin/orders/:id/status', postUpdateOrderStatus);
