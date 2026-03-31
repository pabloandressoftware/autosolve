import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Consulta por código. Es pública a propósito: el conductor comparte el código
   * con quien recoge el carro. Solo expone el avance del servicio, nunca datos
   * personales del dueño ni la placa completa.
   */
  async findByCode(code: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: {
        service: { select: { name: true, durationMin: true } },
        workshop: { select: { name: true, address: true, phone: true } },
        vehicle: { select: { brand: true, model: true, plate: true } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('No encontramos una cita con ese código');
    }

    return {
      code: appointment.code,
      status: appointment.status,
      scheduledAt: appointment.scheduledAt,
      service: appointment.service,
      workshop: appointment.workshop,
      vehicle: {
        brand: appointment.vehicle.brand,
        model: appointment.vehicle.model,
        plate: maskPlate(appointment.vehicle.plate),
      },
      timeline: appointment.events.map((event) => ({
        status: event.status,
        message: event.message,
        at: event.createdAt,
      })),
    };
  }

  async findIdByCode(code: string) {
    const { id } = await this.prisma.appointment.findUniqueOrThrow({
      where: { code: code.toUpperCase().trim() },
      select: { id: true },
    });

    return id;
  }
}

/** ABC123 → ABC**3, suficiente para reconocer el carro sin publicar la placa. */
export function maskPlate(plate: string): string {
  if (plate.length <= 4) {
    return plate;
  }

  return `${plate.slice(0, 3)}${'*'.repeat(plate.length - 4)}${plate.slice(-1)}`;
}
