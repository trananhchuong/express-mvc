import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { paginate } from '../lib/pagination.js';

const LIMIT = 10;

export async function getUsers(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({ skip: (page - 1) * LIMIT, take: LIMIT, orderBy: { id: 'asc' } }),
  ]);
  res.render('users/index', { title: 'Users', users, ...paginate(total, page, LIMIT) });
}

export function getCreateUser(_req: Request, res: Response) {
  res.render('users/create', { title: 'Create User', error: null, fields: {} });
}

export async function postCreateUser(req: Request, res: Response) {
  const { username, fullName, password, address, phone, accountType } = req.body as Record<string, string>;
  const avatar = req.file ? `/uploads/${req.file.filename}` : '';

  try {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { username, fullName, password: hashed, address, phone, accountType, avatar },
    });
    res.redirect('/admin/users');
  } catch (err: unknown) {
    const isDuplicate =
      typeof err === 'object' && err !== null && 'code' in err &&
      (err as { code: string }).code === 'P2002';
    res.status(400).render('users/create', {
      title: 'Create User',
      error: isDuplicate ? 'Username already taken.' : 'Failed to create user.',
      fields: { username, fullName, address, phone, accountType },
    });
  }
}

export async function getEditUser(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
  if (!user) return res.status(404).render('errors/404');
  res.render('users/edit', { title: 'Edit User', user, error: null });
}

export async function postEditUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { fullName, address, phone, accountType, password } = req.body as Record<string, string>;

  const data: Record<string, unknown> = { fullName, address, phone, accountType };
  if (password) data.password = await bcrypt.hash(password, 10);
  if (req.file) data.avatar = `/uploads/${req.file.filename}`;

  try {
    await prisma.user.update({ where: { id }, data });
    res.redirect('/admin/users');
  } catch {
    const user = await prisma.user.findUnique({ where: { id } });
    res.status(400).render('users/edit', { title: 'Edit User', user, error: 'Update failed.' });
  }
}

export async function postDeleteUser(req: Request, res: Response) {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.redirect('/admin/users');
}
