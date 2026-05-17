import { Router } from 'express';
import { getShop, getShopDetail } from '../controllers/shop.controller.js';

export const shopRouter = Router();

shopRouter.get('/', getShop);
shopRouter.get('/shop', getShop);
shopRouter.get('/shop/:id', getShopDetail);
