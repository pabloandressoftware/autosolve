# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
# Prisma necesita OpenSSL para detectar el motor correcto en musl.
RUN apk add --no-cache openssl
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# El workspace de web no se necesita para construir la API.
RUN npm ci --workspace @autosolve/api --include-workspace-root

FROM deps AS build
WORKDIR /repo
COPY apps/api apps/api
RUN npx prisma generate --schema apps/api/prisma/schema.prisma \
 && npm run build --workspace @autosolve/api \
 && npm run build:seed --workspace @autosolve/api

FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /app

# El usuario se fija antes de copiar nada: `COPY --chown` evita un `chown -R`
# sobre node_modules, que son decenas de miles de archivos.
RUN chown node:node /app
USER node

COPY --chown=node:node --from=build /repo/package.json /repo/package-lock.json ./
COPY --chown=node:node --from=build /repo/apps/api/package.json apps/api/
COPY --chown=node:node --from=build /repo/apps/web/package.json apps/web/
# --ignore-scripts: el postinstall de la API ejecuta `prisma generate`, que
# aquí no tiene schema a mano; el cliente se copia ya generado desde `build`.
RUN npm ci --omit=dev --ignore-scripts --workspace @autosolve/api --include-workspace-root \
 && npm cache clean --force

# Cliente de Prisma ya generado en la etapa de build.
COPY --chown=node:node --from=build /repo/node_modules/.prisma node_modules/.prisma
COPY --chown=node:node --from=build /repo/node_modules/@prisma/client node_modules/@prisma/client

COPY --chown=node:node --from=build /repo/apps/api/dist apps/api/dist
COPY --chown=node:node --from=build /repo/apps/api/dist-seed apps/api/dist-seed
COPY --chown=node:node --from=build /repo/apps/api/prisma apps/api/prisma
COPY --chown=node:node --chmod=755 apps/api/docker-entrypoint.sh ./

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
