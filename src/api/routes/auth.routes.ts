import { Router } from 'express';
import { register } from '../../controllers/auth.controller.js';
import { validateRegister } from '../middlewares/validator.js';

export const authRouter = Router();

authRouter.post('/register', validateRegister, register);
