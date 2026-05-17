import { Router } from 'express';
import { upload } from '../lib/upload.js';
import {
  getProducts, getCreateProduct, postCreateProduct,
  getEditProduct, postEditProduct, postDeleteProduct,
} from '../controllers/product.controller.js';

export const productRouter = Router();

productRouter.get('/admin/products', getProducts);
productRouter.get('/admin/products/create', getCreateProduct);
productRouter.post('/admin/products/create', upload.single('image'), postCreateProduct);
productRouter.get('/admin/products/:id/edit', getEditProduct);
productRouter.post('/admin/products/:id/edit', upload.single('image'), postEditProduct);
productRouter.post('/admin/products/:id/delete', postDeleteProduct);
