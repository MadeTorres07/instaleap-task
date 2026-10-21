import type { RequestHandler } from 'express';
import {
  registerUser,
  type RegisterUserInput,
} from '../services/auth.service.js';

export const register: RequestHandler = async (req, res) => {
  const input = req.body as RegisterUserInput;
  const user = await registerUser(input);

  res.status(201).json({
    success: true,
    data: user,
  });
};
    