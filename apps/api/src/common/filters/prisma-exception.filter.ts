import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Traduce los errores conocidos de Prisma a respuestas HTTP con mensaje en
 * español, para que nunca se filtre un stack trace ni el nombre de una tabla.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    const { status, message } = this.translate(exception);
    this.logger.warn(`Prisma ${exception.code}: ${exception.message.split('\n').pop()}`);

    response.status(status).json({ statusCode: status, message });
  }

  private translate(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002':
        return { status: HttpStatus.CONFLICT, message: 'Ese registro ya existe' };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'La referencia enviada no corresponde a un registro válido',
        };
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'El registro no existe' };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Ocurrió un error procesando la solicitud',
        };
    }
  }
}
