import { Router } from 'express';
import {
  createTaskHandler,
  deleteTaskHandler,
  getTaskHandler,
  listTasksHandler,
  updateTaskHandler,
} from '../../controllers/tasks.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  validateCreateTask,
  validateUpdateTask,
} from '../middlewares/taskValidator.js';

export const tasksRouter = Router();

// Todas las rutas de tareas requieren un JWT válido.
tasksRouter.use(authenticate);

tasksRouter.post('/', validateCreateTask, createTaskHandler);
tasksRouter.get('/', listTasksHandler);
tasksRouter.get('/:id', getTaskHandler);
tasksRouter.put('/:id', validateUpdateTask, updateTaskHandler);
tasksRouter.delete('/:id', deleteTaskHandler);
