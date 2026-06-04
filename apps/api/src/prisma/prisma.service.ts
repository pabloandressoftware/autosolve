import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Se intenta conectar al arrancar para pagar la latencia una sola vez, pero
   * un fallo aquí no tumba la aplicación: en serverless eso convierte una base
   * momentáneamente inalcanzable en un 500 de toda la función, y hasta
   * /api/health dejaría de responder. Prisma reconecta de forma perezosa en la
   * primera consulta, y el healthcheck reporta el estado real.
   */
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.error(
        `No se pudo conectar a la base de datos al arrancar: ${(error as Error).message}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
