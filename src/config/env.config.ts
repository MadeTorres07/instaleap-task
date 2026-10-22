import path from 'node:path';
import dotenv from 'dotenv';

type NodeEnv = 'development' | 'production' | 'test';

const VALID_NODE_ENVS: readonly NodeEnv[] = ['development', 'production', 'test'];

/**
 * Lee una variable obligatoria y falla rápido si no está definida.
 */
function required(key: string): string {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(
      `Variable de entorno obligatoria ausente: ${key}. Revisa tu archivo .env.`,
    );
  }

  return value;
}

function optional(key: string, fallback: string): string {
  const value = process.env[key]?.trim();
  return value || fallback;
}

function numberFromEnv(key: string, fallback?: number): number {
  const raw = process.env[key]?.trim();

  if (!raw) {
    if (fallback !== undefined) {
      return fallback;
    }

    throw new Error(`Variable de entorno obligatoria ausente: ${key}.`);
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error(`La variable ${key} debe ser un puerto válido (1-65535).`);
  }

  return value;
}

function nodeEnvFromEnv(): NodeEnv {
  const value = optional('NODE_ENV', 'development');

  if (!VALID_NODE_ENVS.includes(value as NodeEnv)) {
    throw new Error(
      `NODE_ENV inválido: "${value}". Valores permitidos: ${VALID_NODE_ENVS.join(', ')}.`,
    );
  }

  return value as NodeEnv;
}

export interface EnvVars {
  readonly NODE_ENV: NodeEnv;
  readonly PORT: number;
  readonly DB_HOST: string;
  readonly DB_PORT: number;
  readonly DB_USER: string;
  readonly DB_PASSWORD: string;
  readonly DB_NAME: string;
  readonly JWT_SECRET: string;
  readonly JWT_EXPIRES_IN: string;
}

/**
 * Singleton de configuración.
 *
 * El constructor es privado y solo se ejecuta desde `getInstance()`, por lo que
 * `dotenv.config()` se llama una única vez durante la vida del proceso.
 * Las variables recibidas por el sistema operativo (Docker, CI, etc.) tienen
 * prioridad sobre las definidas en el archivo .env.
 */
export class EnvSingleton {
  private static instance: EnvSingleton | null = null;

  public readonly NODE_ENV: EnvVars['NODE_ENV'];
  public readonly PORT: number;
  public readonly DB_HOST: string;
  public readonly DB_PORT: number;
  public readonly DB_USER: string;
  public readonly DB_PASSWORD: string;
  public readonly DB_NAME: string;
  public readonly JWT_SECRET: string;
  public readonly JWT_EXPIRES_IN: string;

  private constructor() {
    dotenv.config({
      path: path.resolve(process.cwd(), '.env'),
      quiet: true,
    });

    this.NODE_ENV = nodeEnvFromEnv();
    this.PORT = numberFromEnv('PORT', 3000);
    this.DB_HOST = optional('DB_HOST', 'localhost');
    this.DB_PORT = numberFromEnv('DB_PORT', 3306);
    this.DB_USER = required('DB_USER');
    this.DB_PASSWORD = required('DB_PASSWORD');
    this.DB_NAME = required('DB_NAME');
    this.JWT_SECRET = required('JWT_SECRET');
    this.JWT_EXPIRES_IN = optional('JWT_EXPIRES_IN', '1h');

    // Evita que la configuración sea modificada en tiempo de ejecución.
    Object.freeze(this);
  }

  public static getInstance(): EnvSingleton {
    EnvSingleton.instance ??= new EnvSingleton();
    return EnvSingleton.instance;
  }

  /**
   * Devuelve una copia inmutable de toda la configuración.
   * Útil para inspección o para inyectarla en otros módulos.
   */
  public getAll(): Readonly<EnvVars> {
    return Object.freeze({
      NODE_ENV: this.NODE_ENV,
      PORT: this.PORT,
      DB_HOST: this.DB_HOST,
      DB_PORT: this.DB_PORT,
      DB_USER: this.DB_USER,
      DB_PASSWORD: this.DB_PASSWORD,
      DB_NAME: this.DB_NAME,
      JWT_SECRET: this.JWT_SECRET,
      JWT_EXPIRES_IN: this.JWT_EXPIRES_IN,
    });
  }
}

// Instancia única, creada en el primer import del módulo.
export const env = EnvSingleton.getInstance();
