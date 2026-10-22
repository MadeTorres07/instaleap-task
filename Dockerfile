# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Etapa 1: builder
# Instala todas las dependencias (incluidas las de desarrollo) y compila TS.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar primero los manifiestos permite reutilizar la capa de npm ci
# mientras no cambien las dependencias.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Eliminar devDependencies antes de copiar node_modules a la imagen final.
# Así las herramientas de build no llegan a producción.
RUN npm prune --omit=dev

# ---------------------------------------------------------------------------
# Etapa 2: producción
# Solo contiene el runtime de Node, package.json, dist y dependencias de prod.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS production

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# package.json es necesario para conservar "type": "module".
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

# Ejecutar con el usuario no privilegiado incluido en la imagen oficial.
USER node

EXPOSE 3000

# Comprobación básica usando wget de BusyBox (incluido en Alpine).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ > /dev/null || exit 1

# Ejecutar Node directamente evita la capa extra de npm como PID 1.
CMD ["node", "dist/index.js"]
