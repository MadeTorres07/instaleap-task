# Instaleap Task API

API REST para la gestión de tareas personales, construida con **Node.js, Express, TypeScript y MySQL**. Incluye registro e inicio de sesión con JWT, operaciones CRUD de tareas aisladas por usuario, validación de cuerpos con AJV, manejo centralizado de errores y documentación interactiva con Swagger/OpenAPI 3.0.

## Descripción y arquitectura

El proyecto sigue una **arquitectura en capas**: cada capa tiene una responsabilidad concreta y depende únicamente de las capas inferiores. Esto mantiene el código desacoplado, facilita las pruebas y permite evolucionar la API sin mezclar detalles HTTP con la lógica de negocio o el acceso a datos.

| Capa | Ubicación | Responsabilidad |
| --- | --- | --- |
| Entrada / composición | `src/index.ts` | Configura Express, middlewares globales, Swagger y el arranque de la aplicación. |
| Rutas | `src/api/routes/` | Definen los endpoints y conectan middlewares con controllers. |
| Middlewares | `src/api/middlewares/` | Autenticación JWT, validación de payloads con AJV y manejo global de errores. |
| Controllers | `src/controllers/` | Adaptan las solicitudes HTTP y construyen las respuestas. |
| Servicios | `src/services/` | Contienen la lógica de negocio: registro, login, tareas y control de propiedad. |
| Persistencia | `src/persistence/` | Gestiona el pool de conexiones y las consultas a MySQL. |
| Configuración | `src/config/` | Carga y valida las variables de entorno en un singleton tipado. |
| Utilidades | `src/utils/` | Definen errores HTTP reutilizables y códigos de error. |

El flujo de una petición es el siguiente:

```text
HTTP Request
  -> Router
  -> Middleware de autenticación / validación
  -> Controller
  -> Service
  -> Persistence (MySQL)
  -> HTTP Response
```

Los errores controlados se propagan hasta el middleware global, que devuelve una respuesta JSON uniforme. La documentación OpenAPI se carga desde `swagger.yaml` y se sirve en `/api-docs`.

### Estructura del proyecto

```text
.
├── src/
│   ├── api/
│   │   ├── middlewares/       # Autenticación, validación y errores
│   │   └── routes/            # Rutas de autenticación y tareas
│   ├── config/                # Configuración tipada desde .env
│   ├── controllers/           # Adaptadores HTTP
│   ├── persistence/           # Pool y conexión a MySQL
│   ├── services/              # Lógica de negocio
│   ├── utils/                 # Errores HTTP
│   └── index.ts               # Punto de entrada y Swagger
├── swagger.yaml               # Contrato OpenAPI 3.0
├── Dockerfile                 # Build multi-stage
├── docker-compose.yml         # API + MySQL
├── .env.example               # Variables de entorno de ejemplo
├── package.json
└── tsconfig.json
```

## Instalación local

### Requisitos previos

- Node.js 20 o superior.
- npm 10 o superior.
- MySQL 8.0 disponible localmente, o Docker para levantar la base de datos.

### Pasos

1. Clona el repositorio y entra en el directorio del proyecto:

   ```bash
   git clone <url-del-repositorio>
   cd instaleap-task
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Crea el archivo de configuración local a partir del ejemplo:

   ```bash
   cp .env.example .env
   ```

4. Edita `.env` con tus credenciales de MySQL. La explicación completa está en la siguiente sección.

5. Crea la base de datos si aún no existe:

   ```sql
   CREATE DATABASE IF NOT EXISTS instaleap_db
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;
   ```

6. Aplica el esquema SQL de las tablas `users` y `tasks` (ver [Esquema de la base de datos](#esquema-de-la-base-de-datos)). La API no ejecuta migraciones automáticamente; sin esas tablas, el registro de usuarios y las operaciones de tareas fallarán aunque la conexión a MySQL sea correcta.

Si prefieres levantar la API y MySQL juntos con Docker, revisa la sección [Docker y Docker Compose](#docker-y-docker-compose). Ese flujo utiliza las variables adicionales que requiere Compose.

## Esquema de la base de datos

La base de datos utilizada es `instaleap_db`. El esquema se compone de dos tablas: `users` almacena las cuentas y `tasks` las tareas de cada usuario, con una relación de uno a muchos mediante `user_id`. La clave foránea usa `ON DELETE CASCADE`, de modo que al eliminar un usuario se eliminan también sus tareas.

```sql
USE instaleap_db;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tasks (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    fecha_vencimiento DATE NULL,
    estado ENUM('pendiente', 'en curso', 'completada') NOT NULL DEFAULT 'pendiente',
    user_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY idx_tasks_user_id (user_id),
    KEY idx_tasks_estado (estado),
    CONSTRAINT fk_tasks_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

Detalles del esquema:

- `users.email` es único (`uq_users_email`), por lo que no pueden registrarse dos cuentas con el mismo correo.
- `users.password` guarda el hash de la contraseña, nunca el valor en texto plano.
- `tasks.estado` solo admite `pendiente`, `en curso` o `completada`, y por defecto es `pendiente`.
- `tasks.fecha_vencimiento` es opcional, al igual que `descripcion`.
- Los índices `idx_tasks_user_id` e `idx_tasks_estado` aceleran las consultas por usuario y por estado.

Puedes guardar el bloque SQL en un archivo `schema.sql` y aplicarlo con:

```bash
mysql -u root -p < schema.sql
```

## Configuración de `.env`

El archivo `.env` se carga al iniciar la aplicación y **no debe versionarse**. Ya está incluido en `.gitignore` y en `.dockerignore`; utiliza `.env.example` como plantilla.

| Variable | Obligatoria | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Entorno de ejecución: `development`, `production` o `test`. |
| `PORT` | No | `3000` | Puerto HTTP en el que escucha la API. |
| `DB_HOST` | No | `localhost` | Host de MySQL. En Docker Compose la API usa `db`. |
| `DB_PORT` | No | `3306` | Puerto de MySQL. |
| `DB_USER` | Sí | — | Usuario de la base de datos. |
| `DB_PASSWORD` | Sí | — | Contraseña del usuario de la base de datos. |
| `DB_NAME` | Sí | — | Nombre de la base de datos. Para este proyecto: `instaleap_db`. |
| `JWT_SECRET` | Sí | — | Clave secreta usada para firmar los JWT con HS256. |
| `JWT_EXPIRES_IN` | No | `1h` | Vigencia del token, por ejemplo `15m`, `1h` o `7d`. |

Ejemplo de configuración local:

```dotenv
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_local
DB_NAME=instaleap_db

JWT_SECRET=tu_clave_secreta_de_al_menos_32_caracteres
JWT_EXPIRES_IN=1h
```

Genera un secreto seguro para `JWT_SECRET` con:

```bash
openssl rand -hex 32
```

No reutilices el valor de ejemplo en producción ni compartas el archivo `.env`. Si falta una variable obligatoria, la API detiene el arranque con un error de configuración; si modificas `.env`, reinicia el proceso para volver a cargarlo.

### Variables adicionales para Docker Compose

Compose lee el mismo archivo `.env` para interpolar sus variables. Además de las anteriores, el despliegue con Docker requiere:

```dotenv
MYSQL_ROOT_PASSWORD=una_clave_root_segura
MYSQL_PASSWORD=una_clave_para_la_api
JWT_SECRET=una_clave_secreta_larga

# Opcionales
API_PORT=3000
JWT_EXPIRES_IN=1h
```

`MYSQL_PASSWORD` se utiliza tanto para el usuario `instaleap` de MySQL como para la conexión de la API. `API_PORT` es el puerto publicado en el host; internamente la API siempre escucha en el puerto `3000`.

## Ejecución

### Desarrollo con `tsx`

Durante el desarrollo se usa **`tsx`** para ejecutar TypeScript directamente, sin necesidad de compilar a JavaScript. `tsx` está incluido en `devDependencies`, por lo que no hace falta instalarlo globalmente. El modo `watch` reinicia el proceso al detectar cambios:

```bash
npx tsx watch src/index.ts
```

Si solo necesitas una ejecución puntual:

```bash
npx tsx src/index.ts
```

La API quedará disponible en `http://localhost:3000` y la documentación interactiva en `http://localhost:3000/api-docs`. Si cambias `PORT` en `.env`, ajusta ambas URLs.

### Producción con `npm run build` y `npm start`

Para producción se compila TypeScript a JavaScript y se ejecuta el resultado compilado:

```bash
npm run build
npm start
```

- `npm run build` ejecuta `tsc` y genera la carpeta `dist/`.
- `npm start` ejecuta `node dist/index.js`.

Antes de iniciar en producción, verifica que `.env` tenga `NODE_ENV=production` o define la variable en el entorno del proceso. `npm start` requiere que `dist/` exista; si cambiaste el código, vuelve a ejecutar `npm run build`.

## Docker y Docker Compose

El proyecto incluye un **Dockerfile con build multi-stage** y un archivo **`docker-compose.yml` listo para desplegar la API junto con MySQL**.

### Imagen de producción

El `Dockerfile` usa `node:20-alpine` en ambas etapas:

1. **Builder**: instala todas las dependencias con `npm ci`, compila TypeScript y elimina las dependencias de desarrollo con `npm prune --omit=dev`.
2. **Producción**: copia únicamente `dist/`, `node_modules` de producción, `package.json` y `swagger.yaml`. La aplicación se ejecuta con el usuario no privilegiado `node`, expone el puerto `3000` y tiene un healthcheck.

### Servicios de Compose

`docker-compose.yml` define dos servicios:

- **`db`**: MySQL 8.0, con base de datos `instaleap_db`, usuario `instaleap`, volumen persistente y healthcheck. No publica el puerto `3306` al host.
- **`api`**: se construye desde el `Dockerfile`, espera a que MySQL esté saludable, recibe la configuración por variables de entorno y publica el puerto `${API_PORT:-3000}:3000`.

Asegúrate de tener en `.env` las variables `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD` y `JWT_SECRET` descritas anteriormente. Después ejecuta:

```bash
docker compose up --build -d
docker compose ps
```

Ver logs de la API:

```bash
docker compose logs -f api
```

La API estará disponible en `http://localhost:3000` y Swagger en `http://localhost:3000/api-docs`, salvo que hayas cambiado `API_PORT`.

Para detener el entorno conservando los datos:

```bash
docker compose down
```

Para detenerlo y eliminar también el volumen de MySQL:

```bash
docker compose down -v
```

El volumen `mysql_data` conserva la información entre reinicios. Al igual que en local, MySQL crea la base de datos vacía; debes aplicar el esquema de `users` y `tasks` una vez (ver [Esquema de la base de datos](#esquema-de-la-base-de-datos)). Con un archivo `schema.sql` en el host puedes hacerlo con:

```bash
docker compose exec -T db sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" instaleap_db' < schema.sql
```
