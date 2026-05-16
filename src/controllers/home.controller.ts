import type { Request, Response } from 'express';

export function getHome(_req: Request, res: Response) {
  res.render('home', {
    title: 'Welcome to express-mvc',
    message: 'Express + TypeScript + EJS',
  });
}
