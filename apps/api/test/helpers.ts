import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

export async function createTestApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  await app.init();

  return { app, prisma: app.get(PrismaService) };
}

/** Correo único por corrida para que las pruebas no choquen entre sí. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@e2e.autosolve.co`;
}

/** Placa única con el formato colombiano ABC123. */
export function uniquePlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const pick = () => letters[Math.floor(Math.random() * letters.length)];
  return `${pick()}${pick()}${pick()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
}

/** Próximo día hábil a la hora indicada, para agendar sin chocar con el horario. */
export function nextBusinessDayAt(hour: number, daysAhead = 1): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  while (date.getDay() === 0) {
    date.setDate(date.getDate() + 1);
  }
  date.setHours(hour, 0, 0, 0);
  return date;
}
