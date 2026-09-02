/**
 * Punto de entrada de la API en Vercel.
 *
 * Es JavaScript plano a propósito: el bundler de Vercel usa esbuild, que no
 * soporta `emitDecoratorMetadata`, y NestJS depende de esa metadata para la
 * inyección de dependencias. Por eso la API se compila antes con `tsc`
 * (`npm run build --workspace @autosolve/api`) y aquí solo se carga el
 * resultado, que ya trae la metadata emitida.
 */
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

const { AppModule } = require('../apps/api/dist/app.module');
const {
  PrismaExceptionFilter,
} = require('../apps/api/dist/common/filters/prisma-exception.filter');

/**
 * La instancia se guarda entre invocaciones: mientras el contenedor sigue
 * caliente, las siguientes peticiones se ahorran el arranque de Nest.
 */
let cachedServer;

async function bootstrap() {
  if (cachedServer) {
    return cachedServer;
  }

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn'],
  });

  // Mismo prefijo y mismas tuberías que en `main.ts`. Helmet y CORS no se
  // configuran aquí: el frontend se sirve desde el mismo dominio, y las
  // cabeceras de seguridad las pone Vercel.
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  await app.init();

  cachedServer = expressApp;
  return cachedServer;
}

module.exports = async (req, res) => {
  const server = await bootstrap();
  return server(req, res);
};
