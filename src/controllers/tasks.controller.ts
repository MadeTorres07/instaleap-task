import type { RequestHandler } from 'express';
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '../services/tasks.service.js';
import { BadRequestError } from '../utils/errors.js';

function parseTaskId(raw: string | string[] | undefined): number {
  if (typeof raw !== 'string') {
    throw new BadRequestError('ID de tarea inválido.');
  }

  const taskId = Number(raw);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    throw new BadRequestError('ID de tarea inválido.');
  }

  return taskId;
}

export const createTaskHandler: RequestHandler = async (req, res) => {
  const userId = req.user!.id;
  const input = req.body as CreateTaskInput;

  const task = await createTask(userId, input);

  res.status(201).json({
    success: true,
    data: task,
  });
};

export const listTasksHandler: RequestHandler = async (req, res) => {
  const userId = req.user!.id;

  const tasks = await getTasks(userId);

  res.status(200).json({
    success: true,
    data: tasks,
  });
};

export const getTaskHandler: RequestHandler = async (req, res) => {
  const userId = req.user!.id;
  const taskId = parseTaskId(req.params.id);

  const task = await getTaskById(taskId, userId);

  res.status(200).json({
    success: true,
    data: task,
  });
};

export const updateTaskHandler: RequestHandler = async (req, res) => {
  const userId = req.user!.id;
  const taskId = parseTaskId(req.params.id);
  const input = req.body as UpdateTaskInput;

  const task = await updateTask(taskId, userId, input);

  res.status(200).json({
    success: true,
    data: task,
  });
};

export const deleteTaskHandler: RequestHandler = async (req, res) => {
  const userId = req.user!.id;
  const taskId = parseTaskId(req.params.id);

  await deleteTask(taskId, userId);

  res.status(204).send();
};
