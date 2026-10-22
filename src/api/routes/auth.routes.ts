import { Router } from 'express';
import { login, register } from '../../controllers/auth.controller.js';
import {
  validateLogin,
  validateRegister,
} from '../middlewares/validator.js';

export const authRouter = Router();

authRouter.post('/register', validateRegister, register);
authRouter.post('/login', validateLogin, login);
