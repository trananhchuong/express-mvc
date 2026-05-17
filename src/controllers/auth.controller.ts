import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';

export function getLogin(_req: Request, res: Response) {
  res.render('auth/login', { title: 'Login' });
}

export function getRegister(_req: Request, res: Response) {
  res.render('auth/register', { title: 'Register' });
}

export async function postRegister(req: Request, res: Response) {
  const { username, fullName, password, confirmPassword } = req.body as {
    username: string;
    fullName: string;
    password: string;
    confirmPassword: string;
  };

  if (password !== confirmPassword) {
    res.status(400).render('auth/register', {
      title: 'Register',
      error: 'Passwords do not match.',
      username,
      fullName,
    });
    return;
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        username,
        fullName,
        password: hashed,
        address: '',
        phone: '',
        accountType: 'user',
        avatar: '',
      },
    });
    res.redirect('/auth/login');
  } catch (err: unknown) {
    const isDuplicate =
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002';

    res.status(400).render('auth/register', {
      title: 'Register',
      error: isDuplicate ? 'Username already taken.' : 'Registration failed. Please try again.',
      username,
      fullName,
    });
  }
}

export async function postLogin(req: Request, res: Response) {
  const { username, password } = req.body as { username: string; password: string };

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).render('auth/login', {
      title: 'Login',
      error: 'Invalid username or password.',
      username,
    });
    return;
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    accountType: user.accountType,
  };

  res.redirect('/');
}

export function getForgotPassword(_req: Request, res: Response) {
  res.render('auth/password', { title: 'Password Recovery' });
}

export function postLogout(req: Request, res: Response) {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
}
