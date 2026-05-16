import { Router } from 'express';
import { getLogin, getRegister, getForgotPassword } from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.get('/auth/login', getLogin);
authRouter.get('/auth/register', getRegister);
authRouter.get('/auth/forgot-password', getForgotPassword);
