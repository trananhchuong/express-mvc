import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { upload } from '../lib/upload.js';
import { prisma } from '../lib/prisma.js';
import {
  getUsers, getCreateUser, postCreateUser,
  getEditUser, postEditUser, postDeleteUser,
} from '../controllers/user.controller.js';

export const userRouter = Router();

function handleUpload(field: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(field)(req, res, async (err) => {
      if (!err) return next();
      const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
      const isCreate = req.path.includes('create');
      const view = isCreate ? 'users/create' : 'users/edit';
      const title = isCreate ? 'Create User' : 'Edit User';
      const extra = isCreate
        ? { fields: req.body }
        : { user: await prisma.user.findUnique({ where: { id: Number(req.params.id) }, include: { roles: { include: { role: true } } } }) };
      const message = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum size is 3 MB.'
        : (err as Error).message;
      res.status(400).render(view, { title, roles, error: message, ...extra });
    });
  };
}

userRouter.get('/admin/users', getUsers);
userRouter.get('/admin/users/create', getCreateUser);
userRouter.post('/admin/users/create', handleUpload('avatar'), postCreateUser);
userRouter.get('/admin/users/:id/edit', getEditUser);
userRouter.post('/admin/users/:id/edit', handleUpload('avatar'), postEditUser);
userRouter.post('/admin/users/:id/delete', postDeleteUser);
