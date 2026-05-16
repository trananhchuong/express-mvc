import type { Request, Response } from 'express';

export function getTables(_req: Request, res: Response) {
  res.render('tables', { title: 'Tables' });
}
