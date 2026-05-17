import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export async function getHome(_req: Request, res: Response) {
  const [userCount, productCount, orderCount, revenueAgg] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalPrice: true } }),
  ]);
  const revenue = Number(revenueAgg._sum.totalPrice ?? 0);
  res.render('home', { title: 'Dashboard', userCount, productCount, orderCount, revenue });
}
