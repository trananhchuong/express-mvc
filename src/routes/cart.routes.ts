import { Router } from 'express';
import {
  getCart,
  postAddToCart,
  postUpdateCart,
  postDeleteCartItem,
  getCheckout,
  postCheckout,
  getOrderHistory,
  getOrderHistoryDetail,
} from '../controllers/cart.controller.js';

export const cartRouter = Router();

cartRouter.get('/cart', getCart);
cartRouter.post('/cart', postAddToCart);
cartRouter.post('/cart/:id/update', postUpdateCart);
cartRouter.post('/cart/:id/delete', postDeleteCartItem);
cartRouter.get('/checkout', getCheckout);
cartRouter.post('/checkout', postCheckout);
cartRouter.get('/orders', getOrderHistory);
cartRouter.get('/orders/:id', getOrderHistoryDetail);
