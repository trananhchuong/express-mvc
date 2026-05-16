import type { Request, Response } from 'express';

export function getCharts(_req: Request, res: Response) {
  res.render('charts', { title: 'Charts' });
}
