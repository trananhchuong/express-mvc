import { Router } from 'express';
import { upload } from '../lib/upload.js';
import {
  getUsers, getCreateUser, postCreateUser,
  getEditUser, postEditUser, postDeleteUser,
} from '../controllers/user.controller.js';

export const userRouter = Router();

userRouter.get('/admin/users', getUsers);
userRouter.get('/admin/users/create', getCreateUser);
userRouter.post('/admin/users/create', upload.single('avatar'), postCreateUser);
userRouter.get('/admin/users/:id/edit', getEditUser);
userRouter.post('/admin/users/:id/edit', upload.single('avatar'), postEditUser);
userRouter.post('/admin/users/:id/delete', postDeleteUser);
