import type { RequestHandler } from 'express';
import {
  loginUser,
  registerUser,
  type LoginUserInput,
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

export const login: RequestHandler = async (req, res) => {
  const input = req.body as LoginUserInput;
  const result = await loginUser(input);

  res.status(200).json({
    success: true,
    data: result,
  });
};
    