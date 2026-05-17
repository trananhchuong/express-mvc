import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { paginate } from '../lib/pagination.js';

const LIMIT = 9;

const sortMap: Record<string, object> = {
  'price-asc':  { price: 'asc'  },
  'price-desc': { price: 'desc' },
  'name-asc':   { name:  'asc'  },
  'name-desc':  { name:  'desc' },
};

export async function getShop(req: Request, res: Response) {
  const page     = Math.max(1, Number(req.query.page) || 1);
  const search   = (req.query.search   as string | undefined)?.trim() ?? '';
  const target   = (req.query.target   as string | undefined)?.trim() ?? '';
  const factory  = (req.query.factory  as string | undefined)?.trim() ?? '';
  const sort     = (req.query.sort     as string | undefined)?.trim() ?? '';
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

  const orderBy = sortMap[sort] ?? { id: 'asc' };

  const where = {
    ...(search  ? { name: { contains: search } } : {}),
    ...(target  ? { target }  : {}),
    ...(factory ? { factory } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}),
                   ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } }
      : {}),
  };

  const [total, products, targets, factories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, skip: (page - 1) * LIMIT, take: LIMIT, orderBy }),
    prisma.product.findMany({ select: { target: true }, distinct: ['target'], orderBy: { target: 'asc' } }),
    prisma.product.findMany({ select: { factory: true }, distinct: ['factory'], orderBy: { factory: 'asc' } }),
  ]);

  res.render('client/shop', {
    title: 'Shop',
    activeNav: 'shop',
    products,
    targets: targets.map(t => t.target),
    factories: factories.map(f => f.factory),
    search,
    selectedTarget: target,
    selectedFactory: factory,
    sort,
    minPrice: minPrice ?? '',
    maxPrice: maxPrice ?? '',
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
