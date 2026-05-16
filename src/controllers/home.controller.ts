import type { Request, Response } from 'express';

export function getHome(_req: Request, res: Response) {
  res.render('home', { title: 'Dashboard' });
}
