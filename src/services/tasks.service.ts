import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../persistence/db.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const TASK_STATUSES = [
  'pendiente',
  'en curso',
  'completada',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface CreateTaskInput {
  titulo: string;
  descripcion?: string | null;
  fecha_vencimiento?: string | null;
  estado?: TaskStatus;
}

export interface UpdateTaskInput {
  titulo?: string;
  descripcion?: string | null;
  fecha_vencimiento?: string | null;
  estado?: TaskStatus;
}

export interface Task {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha_vencimiento: string | null;
  estado: TaskStatus;
  user_id: number;
}

interface TaskRow extends RowDataPacket {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha_vencimiento: string | null;
  estado: TaskStatus;
  user_id: number;
}

const TASK_SELECT = `
  SELECT
    id,
    titulo,
    descripcion,
    DATE_FORMAT(fecha_vencimiento, '%Y-%m-%d') AS fecha_vencimiento,
    estado,
    user_id
  FROM tasks
`;

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    fecha_vencimiento: row.fecha_vencimiento,
    estado: row.estado,
    user_id: row.user_id,
  };
}

export async function createTask(
  userId: number,
  input: CreateTaskInput,
): Promise<Task> {
  const titulo = input.titulo.trim();
  const descripcion = input.descripcion ?? null;
  const fechaVencimiento = input.fecha_vencimiento ?? null;
  const estado = input.estado ?? 'pendiente';

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO tasks
      (titulo, descripcion, fecha_vencimiento, estado, user_id)
     VALUES (?, ?, ?, ?, ?)`,
    [titulo, descripcion, fechaVencimiento, estado, userId],
  );

  return {
    id: result.insertId,
    titulo,
    descripcion,
    fecha_vencimiento: fechaVencimiento,
    estado,
    user_id: userId,
  };
}

export async function getTasks(userId: number): Promise<Task[]> {
  const [rows] = await pool.execute<TaskRow[]>(
    `${TASK_SELECT}
     WHERE user_id = ?
     ORDER BY id DESC`,
    [userId],
  );

  return rows.map(mapTask);
}

export async function getTaskById(
  taskId: number,
  userId: number,
): Promise<Task> {
  const [rows] = await pool.execute<TaskRow[]>(
    `${TASK_SELECT}
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [taskId, userId],
  );

  const task = rows[0];

  if (!task) {
    throw new NotFoundError('Tarea no encontrada.');
  }

  return mapTask(task);
}

export async function updateTask(
  taskId: number,
  userId: number,
  input: UpdateTaskInput,
): Promise<Task> {
  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if (input.titulo !== undefined) {
    fields.push('titulo = ?');
    values.push(input.titulo.trim());
  }

  if (input.descripcion !== undefined) {
    fields.push('descripcion = ?');
    values.push(input.descripcion);
  }

  if (input.fecha_vencimiento !== undefined) {
    fields.push('fecha_vencimiento = ?');
    values.push(input.fecha_vencimiento);
  }

  if (input.estado !== undefined) {
    fields.push('estado = ?');
    values.push(input.estado);
  }

  if (fields.length === 0) {
    throw new BadRequestError('No hay campos para actualizar.');
  }

  values.push(taskId, userId);

  await pool.execute<ResultSetHeader>(
    `UPDATE tasks
     SET ${fields.join(', ')}
     WHERE id = ? AND user_id = ?`,
    values,
  );

  // Si affectedRows es 0 puede ser un update sin cambios o una tarea ajena.
  // getTaskById distingue ambos casos y lanza NotFoundError cuando corresponde.
  return getTaskById(taskId, userId);
}

export async function deleteTask(
  taskId: number,
  userId: number,
): Promise<void> {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?',
    [taskId, userId],
  );

  if (result.affectedRows === 0) {
    throw new NotFoundError('Tarea no encontrada.');
  }
}
