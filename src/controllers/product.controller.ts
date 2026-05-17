import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { paginate } from '../lib/pagination.js';

const LIMIT = 10;

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.coerce.number().positive('Price must be positive'),
  quantity: z.coerce.number().int().min(0, 'Quantity must be >= 0'),
  factory: z.string().min(1, 'Factory is required'),
  target: z.string().min(1, 'Target is required'),
  shortDesc: z.string().min(1, 'Short description is required'),
  detailDesc: z.string().min(1, 'Detail description is required'),
});

export async function getProducts(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const search = (req.query.search as string | undefined)?.trim() ?? '';
  const where = search ? { name: { contains: search } } : {};
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, skip: (page - 1) * LIMIT, take: LIMIT, orderBy: { id: 'asc' } }),
  ]);
  res.render('products/index', { title: 'Products', products, search, ...paginate(total, page, LIMIT) });
}

export function getCreateProduct(_req: Request, res: Response) {
  res.render('products/create', { title: 'Create Product', errors: {}, fields: {} });
}

export async function postCreateProduct(req: Request, res: Response) {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = Object.fromEntries(
      Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0]])
    );
    return res.status(400).render('products/create', {
      title: 'Create Product', errors, fields: req.body,
    });
  }
  const image = req.file ? `/uploads/${req.file.filename}` : '';
  await prisma.product.create({ data: { ...parsed.data, image, sold: 0 } });
  res.redirect('/admin/products');
}

export async function getEditProduct(req: Request, res: Response) {
  const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
  if (!product) return res.status(404).render('errors/404');
  res.render('products/edit', { title: 'Edit Product', product, errors: {} });
}

export async function postEditProduct(req: Request, res: Response) {
  const id = Number(req.params.id);
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    const product = await prisma.product.findUnique({ where: { id } });
    const errors = Object.fromEntries(
      Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0]])
    );
    return res.status(400).render('products/edit', { title: 'Edit Product', product, errors });
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (req.file) data.image = `/uploads/${req.file.filename}`;
  await prisma.product.update({ where: { id }, data });
  res.redirect('/admin/products');
}

export async function postDeleteProduct(req: Request, res: Response) {
  await prisma.product.delete({ where: { id: Number(req.params.id) } });
  res.redirect('/admin/products');
}
