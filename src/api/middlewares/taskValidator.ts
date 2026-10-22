import { ajv, createValidationMiddleware } from './validator.js';
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from '../../services/tasks.service.js';

export const createTaskSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['titulo'],
  properties: {
    titulo: {
      type: 'string',
      minLength: 1,
      maxLength: 150,
      pattern: '\\S',
    },
    descripcion: {
      type: ['string', 'null'],
      maxLength: 5_000,
    },
    fecha_vencimiento: {
      type: ['string', 'null'],
      format: 'date',
    },
    estado: {
      type: 'string',
      enum: ['pendiente', 'en curso', 'completada'],
    },
  },
};

export const updateTaskSchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    titulo: {
      type: 'string',
      minLength: 1,
      maxLength: 150,
      pattern: '\\S',
    },
    descripcion: {
      type: ['string', 'null'],
      maxLength: 5_000,
    },
    fecha_vencimiento: {
      type: ['string', 'null'],
      format: 'date',
    },
    estado: {
      type: 'string',
      enum: ['pendiente', 'en curso', 'completada'],
    },
  },
};

const validateCreateTaskBody = ajv.compile<CreateTaskInput>(createTaskSchema);
const validateUpdateTaskBody = ajv.compile<UpdateTaskInput>(updateTaskSchema);

export const validateCreateTask = createValidationMiddleware(
  validateCreateTaskBody,
  'Datos de tarea inválidos.',
);

export const validateUpdateTask = createValidationMiddleware(
  validateUpdateTaskBody,
  'Datos de actualización inválidos.',
);
