import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { passport } from '../lib/passport.js';

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

export function postLogin(req: Request, res: Response, next: NextFunction) {
  passport.authenticate('local', (err: unknown, user: Express.User | false, info: { message: string }) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: info?.message ?? 'Invalid credentials.',
        username: req.body.username,
      });
    }
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      const isAdmin = user.roles.some(r => r.role.name === 'ADMIN');
      res.redirect(isAdmin ? '/' : '/shop');
    });
  })(req, res, next);
}

export function getForgotPassword(_req: Request, res: Response) {
  res.render('auth/password', { title: 'Password Recovery' });
}

export function postLogout(req: Request, res: Response, next: NextFunction) {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/auth/login');
  });
}
