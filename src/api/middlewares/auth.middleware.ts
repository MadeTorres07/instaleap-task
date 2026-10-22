import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { env } from '../../config/env.config.js';
import { AuthenticationError } from '../../utils/errors.js';

export interface AuthenticatedUser {
  id: number;
}

interface AuthTokenPayload extends JwtPayload {
  id: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function extractBearerToken(header: string | undefined): string {
  if (!header) {
    throw new AuthenticationError('Token no proporcionado');
  }

  // Formato requerido: "Bearer <token>" (el esquema no distingue mayúsculas).
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  const token = match?.[1];

  if (!token) {
    throw new AuthenticationError('Token no proporcionado');
  }

  return token;
}

function isAuthTokenPayload(
  payload: string | JwtPayload,
): payload is AuthTokenPayload {
  return (
    typeof payload !== 'string' &&
    typeof payload.id === 'number' &&
    Number.isInteger(payload.id) &&
    payload.id > 0
  );
}

/**
 * Verifica el JWT y deja el id del usuario autenticado en `req.user`.
 * Debe usarse en rutas privadas:
 *
 * `router.get('/recurso', authenticate, controller);`
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  let payload: string | JwtPayload;

  try {
    payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch {
    throw new AuthenticationError('Token inválido o expirado');
  }

  if (!isAuthTokenPayload(payload)) {
    throw new AuthenticationError('Token inválido o expirado');
  }

  req.user = { id: payload.id };
  next();
};
