import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export async function getCart(req: Request, res: Response) {
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: { details: { include: { product: true } } },
  });
  const totalPrice = cart
    ? cart.details.reduce((sum, d) => sum + Number(d.price) * d.quantity, 0)
    : 0;
  res.render('client/cart', { title: 'My Cart', cart, totalPrice });
}

export async function postAddToCart(req: Request, res: Response) {
  const productId = Number(req.body.productId);
  const quantity = Math.max(1, Number(req.body.quantity) || 1);
  const userId = req.user!.id;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.redirect('/shop');

  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId, sum: 0 },
  });

  const existing = await prisma.cartDetail.findFirst({
    where: { cartId: cart.id, productId },
  });

  if (existing) {
    await prisma.cartDetail.update({
      where: { id: existing.id },
      data: { quantity: { increment: quantity } },
    });
  } else {
    await prisma.cartDetail.create({
      data: { cartId: cart.id, productId, quantity, price: product.price },
    });
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { sum: { increment: quantity } },
  });

  res.redirect('/cart');
}

export async function postUpdateCart(req: Request, res: Response) {
  const detailId = Number(req.params.id);
  const newQty = Math.max(1, Number(req.body.quantity) || 1);

  const detail = await prisma.cartDetail.findUnique({ where: { id: detailId } });
  if (!detail) return res.redirect('/cart');

  const diff = newQty - detail.quantity;
  await prisma.cartDetail.update({ where: { id: detailId }, data: { quantity: newQty } });
  await prisma.cart.update({
    where: { id: detail.cartId },
    data: { sum: { increment: diff } },
  });

  res.redirect('/cart');
}

export async function postDeleteCartItem(req: Request, res: Response) {
  const detailId = Number(req.params.id);

  const detail = await prisma.cartDetail.findUnique({ where: { id: detailId } });
  if (!detail) return res.redirect('/cart');

  await prisma.cartDetail.delete({ where: { id: detailId } });

  const remaining = await prisma.cartDetail.count({ where: { cartId: detail.cartId } });
  if (remaining === 0) {
    await prisma.cart.delete({ where: { id: detail.cartId } });
  } else {
    await prisma.cart.update({
      where: { id: detail.cartId },
      data: { sum: { decrement: detail.quantity } },
    });
  }

  res.redirect('/cart');
}

export async function getCheckout(req: Request, res: Response) {
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: { details: { include: { product: true } } },
  });
  if (!cart || cart.details.length === 0) return res.redirect('/cart');

  const totalPrice = cart.details.reduce((sum, d) => sum + Number(d.price) * d.quantity, 0);
  res.render('client/checkout', {
    title: 'Checkout',
    cart,
    totalPrice,
    receiver: { name: req.user!.fullName, phone: req.user!.accountType !== 'user' ? '' : '' },
  });
}

export async function postCheckout(req: Request, res: Response) {
  const userId = req.user!.id;
  const { receiverName, receiverAddress, receiverPhone, paymentMethod } = req.body as {
    receiverName: string;
    receiverAddress: string;
    receiverPhone: string;
    paymentMethod: string;
  };

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { details: true },
  });
  if (!cart || cart.details.length === 0) return res.redirect('/cart');

  const totalPrice = cart.details.reduce((sum, d) => sum + Number(d.price) * d.quantity, 0);

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: { userId, totalPrice, receiverName, receiverAddress, receiverPhone, paymentMethod },
    });
    await tx.orderItem.createMany({
      data: cart.details.map(d => ({
        orderId: newOrder.id,
        productId: d.productId,
        quantity: d.quantity,
        unitPrice: d.price,
      })),
    });
    for (const d of cart.details) {
      await tx.product.update({
        where: { id: d.productId },
        data: { sold: { increment: d.quantity }, quantity: { decrement: d.quantity } },
      });
    }
    await tx.cart.delete({ where: { id: cart.id } });
    return newOrder;
  });

  res.redirect(`/orders/${order.id}`);
}

export async function getOrderHistory(req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    orderBy: { id: 'desc' },
  });
  res.render('client/order-history', { title: 'My Orders', orders });
}

export async function getOrderHistoryDetail(req: Request, res: Response) {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: { items: { include: { product: true } } },
  });
  if (!order || order.userId !== req.user!.id) return res.status(403).render('errors/403', { title: '403 – Forbidden' });
  res.render('client/order-detail', { title: `Order #${order.id}`, order });
}
