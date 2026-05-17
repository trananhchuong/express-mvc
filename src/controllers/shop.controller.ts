import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { paginate } from '../lib/pagination.js';

const LIMIT = 9;

export async function getShop(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const search = (req.query.search as string | undefined)?.trim() ?? '';
  const target = (req.query.target as string | undefined)?.trim() ?? '';

  const where = {
    ...(search ? { name: { contains: search } } : {}),
    ...(target ? { target } : {}),
  };

  const [total, products, targets] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      orderBy: { id: 'asc' },
    }),
    prisma.product.findMany({
      select: { target: true },
      distinct: ['target'],
      orderBy: { target: 'asc' },
    }),
  ]);

  res.render('client/shop', {
    title: 'Shop',
    activeNav: 'shop',
    products,
    targets: targets.map(t => t.target),
    search,
    selectedTarget: target,
    ...paginate(total, page, LIMIT),
  });
}

export async function getShopDetail(req: Request, res: Response) {
  const id = Number(req.params.id);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return res.status(404).render('errors/404');

  const related = await prisma.product.findMany({
    where: { target: product.target, NOT: { id } },
    take: 4,
    orderBy: { id: 'asc' },
  });

  res.render('client/shop-detail', {
    title: product.name,
    activeNav: 'shop',
    product,
    related,
  });
}
