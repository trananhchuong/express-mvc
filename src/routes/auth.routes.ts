import { Router } from 'express';
import { getLogin, postLogin, getRegister, postRegister, getForgotPassword, postLogout } from '../controllers/auth.controller.js';
import { redirectIfAuthenticated } from '../middleware/auth.middleware.js';

export const authRouter = Router();

authRouter.get('/auth/login', redirectIfAuthenticated, getLogin);
authRouter.post('/auth/login', postLogin);
authRouter.get('/auth/register', redirectIfAuthenticated, getRegister);
authRouter.post('/auth/register', postRegister);
authRouter.get('/auth/forgot-password', getForgotPassword);
authRouter.post('/auth/logout', postLogout);
