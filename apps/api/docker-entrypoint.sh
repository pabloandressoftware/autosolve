#!/bin/sh
set -e

# Las migraciones se aplican al arrancar para que un despliegue nuevo levante
# con el esquema al día sin un paso manual.
echo "Aplicando migraciones…"
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

# El catálogo de servicios y los talleres aliados son datos que la app necesita
# para funcionar. El seed es idempotente (usa upsert), así que es seguro
# dejarlo activo en cada arranque.
if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "Sincronizando catálogo de servicios…"
  node apps/api/dist-seed/seed.js
fi

echo "Iniciando la API…"
exec node apps/api/dist/main.js
