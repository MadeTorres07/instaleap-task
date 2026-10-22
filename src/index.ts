import { fileURLToPath } from 'node:url';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { errorHandler } from './api/middlewares/errorHandler.js';
import { authRouter } from './api/routes/auth.routes.js';
import { tasksRouter } from './api/routes/tasks.routes.js';
import { env } from './config/env.config.js';
import { testConnection } from './persistence/db.js';

// El archivo vive en la raíz del proyecto, tanto en desarrollo como en dist/.
const swaggerDocument = YAML.load(
  fileURLToPath(new URL('../swagger.yaml', import.meta.url)),
);

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API funcionando',
  });
});

// Documentación interactiva OpenAPI 3.0.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/auth', authRouter);
app.use('/tasks', tasksRouter);

app.use(errorHandler);

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
