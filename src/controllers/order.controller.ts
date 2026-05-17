import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { paginate } from '../lib/pagination.js';

export async function postUpdateOrderStatus(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { status, paymentStatus } = req.body as Record<string, string>;
  await prisma.order.update({ where: { id }, data: { status, paymentStatus } });
  res.redirect(`/admin/orders/${id}`);
}

const LIMIT = 10;

export async function getOrders(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const [total, orders] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      orderBy: { id: 'desc' },
      include: { user: { select: { username: true, fullName: true } } },
    }),
  ]);
  res.render('orders/index', { title: 'Orders', orders, ...paginate(total, page, LIMIT) });
}

export async function getOrderDetail(req: Request, res: Response) {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      user: { select: { username: true, fullName: true } },
      items: { include: { product: { select: { name: true, image: true } } } },
    },
  });
  if (!order) return res.status(404).render('errors/404');
  res.render('orders/detail', { title: `Order #${order.id}`, order });
}
