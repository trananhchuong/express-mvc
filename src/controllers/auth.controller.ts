import type { Request, Response } from 'express';

export function getLogin(_req: Request, res: Response) {
  res.render('auth/login', { title: 'Login' });
}

export function getRegister(_req: Request, res: Response) {
  res.render('auth/register', { title: 'Register' });
}

export function getForgotPassword(_req: Request, res: Response) {
  res.render('auth/password', { title: 'Password Recovery' });
}
