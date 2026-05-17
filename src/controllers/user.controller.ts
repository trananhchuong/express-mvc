import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { paginate } from '../lib/pagination.js';

const LIMIT = 10;

const userWithRoles = {
  roles: { include: { role: true } },
} as const;

export async function getUsers(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      orderBy: { id: 'asc' },
      include: userWithRoles,
    }),
  ]);
  res.render('users/index', { title: 'Users', users, ...paginate(total, page, LIMIT) });
}

export async function getCreateUser(_req: Request, res: Response) {
  const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
  res.render('users/create', { title: 'Create User', roles, error: null, fields: {} });
}

export async function postCreateUser(req: Request, res: Response) {
  const { username, fullName, password, address, phone, roleId } = req.body as Record<string, string>;
  const avatar = req.file ? `/uploads/${req.file.filename}` : '';

  const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, fullName, password: hashed, address, phone, accountType: 'user', avatar },
    });
    if (roleId) {
      await prisma.userRole.create({ data: { userId: user.id, roleId: Number(roleId) } });
    }
    res.redirect('/admin/users');
  } catch (err: unknown) {
    const isDuplicate =
      typeof err === 'object' && err !== null && 'code' in err &&
      (err as { code: string }).code === 'P2002';
    res.status(400).render('users/create', {
      title: 'Create User',
      roles,
      error: isDuplicate ? 'Username already taken.' : 'Failed to create user.',
      fields: { username, fullName, address, phone, roleId },
    });
  }
}

export async function getEditUser(req: Request, res: Response) {
  const [user, roles] = await Promise.all([
    prisma.user.findUnique({ where: { id: Number(req.params.id) }, include: userWithRoles }),
    prisma.role.findMany({ orderBy: { name: 'asc' } }),
  ]);
  if (!user) return res.status(404).render('errors/404');
  res.render('users/edit', { title: 'Edit User', user, roles, error: null });
}

export async function postEditUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { fullName, address, phone, roleId, password } = req.body as Record<string, string>;

  const data: Record<string, unknown> = { fullName, address, phone };
  if (password) data.password = await bcrypt.hash(password, 10);
  if (req.file) data.avatar = `/uploads/${req.file.filename}`;

  try {
    await prisma.user.update({ where: { id }, data });
    if (roleId) {
      await prisma.userRole.deleteMany({ where: { userId: id } });
      await prisma.userRole.create({ data: { userId: id, roleId: Number(roleId) } });
    }
    res.redirect('/admin/users');
  } catch {
    const [user, roles] = await Promise.all([
      prisma.user.findUnique({ where: { id }, include: userWithRoles }),
      prisma.role.findMany({ orderBy: { name: 'asc' } }),
    ]);
    res.status(400).render('users/edit', { title: 'Edit User', user, roles, error: 'Update failed.' });
  }
}

export async function postDeleteUser(req: Request, res: Response) {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.redirect('/admin/users');
}
