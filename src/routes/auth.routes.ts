import { Router } from 'express';
import { getLogin, postLogin, getRegister, postRegister, getForgotPassword, postLogout } from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.get('/auth/login', getLogin);
authRouter.post('/auth/login', postLogin);
authRouter.get('/auth/register', getRegister);
authRouter.post('/auth/register', postRegister);
authRouter.get('/auth/forgot-password', getForgotPassword);
authRouter.post('/auth/logout', postLogout);
