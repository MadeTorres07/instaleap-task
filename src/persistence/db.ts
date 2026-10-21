import { createPool, type Pool } from 'mysql2/promise';
import { env } from '../config/env.config.js';

/**
 * Pool de conexiones reutilizables.
 *
 * Las conexiones se abren bajo demanda y se reutilizan; no se crea una
 * conexión nueva por cada consulta.
 */
export const pool: Pool = createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60_000,
  queueLimit: 0,
  connectTimeout: 10_000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Prueba que el pool pueda obtener una conexión válida.
 * Devuelve `true` si MySQL responde correctamente.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();

    try {
      await connection.ping();

      console.log(
        `[db] Conexión exitosa a MySQL en ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`,
      );

      return true;
    } finally {
      // Siempre devuelve la conexión al pool, incluso si ping() falla.
      connection.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[db] Error al conectar con MySQL: ${message}`);
    return false;
  }
}
