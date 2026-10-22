/**
 * Error base para errores controlados de la API.
 * Permite transportar el código HTTP y un código de error propio.
 */
export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: unknown;

  public constructor(
    statusCode: number,
    message: string,
    code = 'HTTP_ERROR',
    details?: unknown,
  ) {
    super(message);

    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends HttpError {
  public constructor(message = 'Solicitud inválida.', details?: unknown) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

export class ConflictError extends HttpError {
  public constructor(
    message = 'El recurso entra en conflicto con el estado actual.',
    details?: unknown,
  ) {
    super(409, message, 'CONFLICT', details);
  }
}

export class AuthenticationError extends HttpError {
  public constructor(
    message = 'Credenciales inválidas.',
    details?: unknown,
  ) {
    super(401, message, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends HttpError {
  public constructor(
    message = 'No tienes permisos para acceder a este recurso.',
    details?: unknown,
  ) {
    super(403, message, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends HttpError {
  public constructor(message = 'Recurso no encontrado.', details?: unknown) {
    super(404, message, 'NOT_FOUND', details);
  }
}
