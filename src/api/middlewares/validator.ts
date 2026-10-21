import { Ajv, type ErrorObject } from 'ajv';
import addFormatsModule from 'ajv-formats';
import type { RequestHandler } from 'express';
import type { RegisterUserInput } from '../../services/auth.service.js';
import { BadRequestError } from '../../utils/errors.js';

type AddFormats = (instance: Ajv) => Ajv;

// ajv-formats es CommonJS: el default real es la función, aunque sus tipos
// se resuelvan como un namespace bajo NodeNext/ESM.
const addFormats = addFormatsModule as unknown as AddFormats;

export const ajv = new Ajv({
  allErrors: true,
  strict: true,
  coerceTypes: false,
  removeAdditional: false,
});

addFormats(ajv);

export const registerUserSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['nombre', 'email', 'password'],
  properties: {
    nombre: {
      type: 'string',
      minLength: 2,
      maxLength: 100,
      pattern: '\\S',
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255,
    },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 72,
    },
  },
};

const validateRegisterBody = ajv.compile<RegisterUserInput>(registerUserSchema);

function formatValidationErrors(
  errors: ErrorObject[] | null | undefined,
): Array<{ field: string; message: string }> {
  return (errors ?? []).map((error) => {
    const missingProperty = error.params.missingProperty;
    const additionalProperty = error.params.additionalProperty;

    const field = error.instancePath
      ? error.instancePath.slice(1)
      : typeof missingProperty === 'string'
        ? missingProperty
        : typeof additionalProperty === 'string'
          ? additionalProperty
          : 'body';

    return {
      field,
      message: error.message ?? 'Valor inválido.',
    };
  });
}

export const validateRegister: RequestHandler = (req, _res, next) => {
  const payload: unknown = req.body;

  if (!validateRegisterBody(payload)) {
    next(
      new BadRequestError(
        'Datos de registro inválidos.',
        formatValidationErrors(validateRegisterBody.errors),
      ),
    );
    return;
  }

  next();
};
