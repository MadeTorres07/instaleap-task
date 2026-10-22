import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { env } from '../config/env.config.js';
import { pool } from '../persistence/db.js';
import {
  AuthenticationError,
  BadRequestError,
  ConflictError,
} from '../utils/errors.js';

const SALT_ROUNDS = 10;
const BCRYPT_MAX_BYTES = 72;

export interface RegisterUserInput {
  nombre: string;
  email: string;
  password: string;
}

export interface RegisteredUser {
  id: number;
  nombre: string;
  email: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
}

interface ExistingUserRow extends RowDataPacket {
  id: number;
}

interface LoginUserRow extends RowDataPacket {
  id: number;
  password: string;
}

function isDuplicateEntryError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ER_DUP_ENTRY'
  );
}

/**
 * Registra un usuario. La contraseña se almacena únicamente como hash.
 */
export async function registerUser(
  input: RegisterUserInput,
): Promise<RegisteredUser> {
  const nombre = input.nombre.trim();
  const email = input.email.trim().toLowerCase();

  // bcrypt ignora silenciosamente los bytes posteriores al 72.
  if (Buffer.byteLength(input.password, 'utf8') > BCRYPT_MAX_BYTES) {
    throw new BadRequestError(
      `La contraseña no puede superar los ${BCRYPT_MAX_BYTES} bytes.`,
    );
  }

  const [existingUsers] = await pool.execute<ExistingUserRow[]>(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [email],
  );

  if (existingUsers.length > 0) {
    throw new ConflictError('El email ya está registrado.');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, passwordHash],
    );

    return {
      id: result.insertId,
      nombre,
      email,
    };
  } catch (error) {
    // Cubre la condición de carrera entre el SELECT y el INSERT.
    if (isDuplicateEntryError(error)) {
      throw new ConflictError('El email ya está registrado.');
    }

    throw error;
  }
}

/**
 * Valida las credenciales y devuelve un JWT firmado con el id del usuario.
 */
export async function loginUser(input: LoginUserInput): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();

  const [users] = await pool.execute<LoginUserRow[]>(
    'SELECT id, password FROM users WHERE email = ? LIMIT 1',
    [email],
  );

  const user = users[0];

  if (!user) {
    throw new AuthenticationError();
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);

  if (!passwordMatches) {
    throw new AuthenticationError();
  }

  const expiresIn = env.JWT_EXPIRES_IN as NonNullable<
    SignOptions['expiresIn']
  >;

  const token = jwt.sign(
    { id: user.id },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn,
    },
  );

  return { token };
}
