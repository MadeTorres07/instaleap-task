import express from 'express';
import { env } from './config/env.config.js';
import { testConnection } from './persistence/db.js';

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API funcionando',
  });
});

async function bootstrap(): Promise<void> {
  const databaseConnected = await testConnection();

  if (!databaseConnected) {
    console.warn(
      '[api] La API se iniciará sin una conexión confirmada a MySQL.',
    );
  }

  app.listen(env.PORT, () => {
    console.log(
      `[${env.NODE_ENV}] API escuchando en http://localhost:${env.PORT}`,
    );
  });
}

void bootstrap().catch((error: unknown) => {
  console.error('[api] Error fatal durante el arranque:', error);
  process.exit(1);
});

export { app };
