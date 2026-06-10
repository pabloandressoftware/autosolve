<div align="center">

<img src="apps/web/public/icon-192.png" width="88" alt="" />

# AutoSolve

**Tu taller en un click.** Diagnostica la falla de tu carro, agenda en un taller
aliado y sigue el servicio en tiempo real.

Proyecto del **Equipo Morado** — Universidad Icesi.

**[▶ Ver la app en vivo](https://autosolve-six.vercel.app)** · [API](https://autosolve-six.vercel.app/api/health) · [Documentación OpenAPI](https://autosolve-six.vercel.app/api/docs)

[![CI](https://github.com/pabloandressoftware/autosolve/actions/workflows/ci.yml/badge.svg)](https://github.com/pabloandressoftware/autosolve/actions/workflows/ci.yml)

</div>

---

## El problema

El **63%** de los talleres reportan alta dificultad para atender reparaciones
diarias porque el cliente no logra describir la falla de su vehículo. Del otro
lado, lo que más valora el conductor al elegir taller es la **rapidez**.

> **Pregunta reto:** ¿podría una herramienta digital mejorar la comunicación
> entre conductores y talleres, reduciendo errores y tiempos de espera?

Este repositorio es la respuesta funcional a esa pregunta. El
[prototipo](docs/prototipo.md) se validó con usuarios el 18/09/2025 y aquí está
implementado como producto: backend, frontend, pruebas y despliegue.

## Qué hace

| Módulo | Qué resuelve |
| --- | --- |
| **Diagnóstico** | Un chatbot por reglas traduce «suena un chirrido al frenar» a un servicio concreto, con nivel de urgencia. |
| **Catálogo** | Servicios con precio y duración; el buscador también cruza síntomas, no solo nombres. |
| **Agendamiento** | Cita en un taller aliado, validando horario de atención y cupos ocupados. |
| **Seguimiento** | Línea de tiempo del servicio, en vivo por SSE, consultable con un código sin necesidad de cuenta. |
| **Historial** | Registro de cada servicio y lo invertido en mantenimiento. |
| **Vehículos** | Varios carros por usuario, con placa validada al formato colombiano. |

## Arquitectura

```
autosolve/
├── apps/
│   ├── api/                 NestJS · Prisma · PostgreSQL
│   │   ├── src/auth/          registro, login y JWT
│   │   ├── src/vehicles/      vehículos del conductor
│   │   ├── src/services/      catálogo y recomendaciones
│   │   ├── src/appointments/  agendamiento y reglas de cupos
│   │   ├── src/chatbot/       motor de diagnóstico por reglas
│   │   ├── src/tracking/      seguimiento por código + stream SSE
│   │   └── test/              pruebas e2e contra PostgreSQL real
│   └── web/                 React · Vite · TypeScript · Tailwind (PWA)
├── e2e/                     Playwright, viewport de teléfono
├── docs/                    contexto, prototipo y decisiones
└── docker-compose.yml
```

Las decisiones de stack y las alternativas descartadas están en
[docs/adr-001-stack.md](docs/adr-001-stack.md).

### Por qué un chatbot por reglas y no un LLM

La prueba con usuarios mostró que necesitan una respuesta **inmediata y
predecible**, no una conversación abierta. El motor de
[`diagnosis.engine.ts`](apps/api/src/chatbot/diagnosis.engine.ts) normaliza el
texto (tildes, mayúsculas, puntuación) y puntúa cada síntoma por palabras clave,
dando más peso a las frases que a las palabras sueltas. Es auditable, se prueba
sin red y responde en milisegundos. Cuando no hay confianza suficiente, pide más
detalle en vez de inventar un diagnóstico.

## Levantarlo en local

**Requisitos:** Node 22+ y Docker (o un PostgreSQL 16 propio).

```bash
git clone https://github.com/pabloandressoftware/autosolve.git
cd autosolve
npm install

# 1. Base de datos
docker run -d --name autosolve-pg \
  -e POSTGRES_USER=autosolve -e POSTGRES_PASSWORD=autosolve -e POSTGRES_DB=autosolve \
  -p 5432:5432 postgres:16-alpine

# 2. Variables de entorno
cp apps/api/.env.example apps/api/.env

# 3. Esquema y datos del catálogo
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
npx ts-node apps/api/prisma/seed.ts

# 4. A correr (en dos terminales)
npm run dev --workspace @autosolve/api    # http://localhost:3000
npm run dev --workspace @autosolve/web    # http://localhost:5173
```

La documentación interactiva de la API queda en
**http://localhost:3000/api/docs** (en producción,
[/api/docs](https://autosolve-six.vercel.app/api/docs)).

**Usuario de prueba:** `demo@autosolve.co` / `Demo1234!`

## Con Docker Compose

```bash
cp .env.example .env
# define JWT_SECRET, por ejemplo: openssl rand -base64 32
docker compose up --build
```

- Web → http://localhost:8080
- API → http://localhost:3000/api

Las migraciones se aplican solas al arrancar el contenedor de la API.

## Pruebas

```bash
npm test                                   # unitarias de ambos workspaces
npm run test:e2e --workspace @autosolve/api  # API contra PostgreSQL real
npm run test:e2e                           # recorrido completo con Playwright
```

| Suite | Qué cubre |
| --- | --- |
| **API — unitarias** | Motor de diagnóstico, reglas de horario y solapamiento, transiciones de estado, aislamiento entre usuarios, hash de contraseñas. |
| **API — e2e** | Registro → vehículo → diagnóstico → agendamiento → seguimiento → historial, contra una base real. |
| **Web — unitarias** | Cliente HTTP, formato de moneda y duración, pantallas de login y chat. |
| **Playwright** | El mismo recorrido en un navegador con viewport de teléfono. |

## Despliegue

**En producción:** https://autosolve-six.vercel.app

El repositorio trae tres caminos listos:

1. **Vercel** (el despliegue actual) — `vercel.json` construye la web como
   estática y monta la API como función serverless en `api/index.js`, con
   PostgreSQL en Neon. Necesita `DATABASE_URL` (pooler), `DIRECT_URL`
   (conexión directa, para migraciones) y `JWT_SECRET`.

   Dos detalles que no son obvios: las funciones de Vercel no enrutan
   sub-rutas por sí solas, así que un rewrite manda todo `/api/*` a una única
   función con la ruta original en el query string; y la API se precompila
   con `tsc` porque el bundler de Vercel usa esbuild, que no soporta
   `emitDecoratorMetadata`, del que depende la inyección de dependencias de
   NestJS.

2. **Render** — [`render.yaml`](render.yaml) define base de datos, API y web
   estática. Se conecta el repo y Render lee el blueprint.
3. **Contenedores** — el workflow [`deploy.yml`](.github/workflows/deploy.yml)
   publica las imágenes en GHCR en cada push a `main` y dispara los deploy hooks
   si están configurados como variables del repositorio
   (`RENDER_API_DEPLOY_HOOK`, `RENDER_WEB_DEPLOY_HOOK`).

### Variables de entorno de la API

| Variable | Obligatoria | Descripción |
| --- | :---: | --- |
| `DATABASE_URL` | sí | Cadena de conexión a PostgreSQL. |
| `JWT_SECRET` | sí | Secreto de firma de los tokens. |
| `JWT_EXPIRES_IN` | no | Vigencia del token (`7d` por defecto). |
| `PORT` | no | Puerto del servidor (`3000`). |
| `CORS_ORIGIN` | no | Orígenes permitidos, separados por coma. |

### Limitación conocida en Vercel

El seguimiento en vivo usa SSE. En funciones serverless la conexión se
corta al llegar al límite de duración; `EventSource` reconecta solo, así
que la línea de tiempo sigue actualizándose, pero el indicador «En vivo»
parpadea. En el despliegue con contenedores (Render o Docker) no ocurre,
porque el proceso es de larga vida.

## Equipo Morado

| Integrante | Código |
| --- | --- |
| Sharik Camila Rueda | A00399189 |
| Valentina Gómez | A00398790 |
| Mariana De La Cruz | A00399618 |
| Alexis Delgado | A00399176 |
| Pablo Guzmán | A00399523 |
| Cristian Del Castillo | A00369953 |

## Licencia

MIT — ver [LICENSE](LICENSE).
