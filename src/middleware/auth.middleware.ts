import type { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.redirect('/auth/login');
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.roles.some(r => r.role.name === 'ADMIN')) return next();
  res.status(403).render('errors/403', { title: '403 – Forbidden' });
}

export function redirectIfAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return next();
  const isAdmin = req.user?.roles.some(r => r.role.name === 'ADMIN');
  res.redirect(isAdmin ? '/dashboard' : '/');
}
