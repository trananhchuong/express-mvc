import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = err.status ?? 500;
  if (req.accepts('html')) {
    res.status(status).render(status === 401 ? 'errors/401' : 'errors/500');
  } else {
    res.status(status).json({ error: err.message ?? 'Internal Server Error' });
  }
};
