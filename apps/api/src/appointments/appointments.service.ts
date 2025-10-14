import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { TrackingBus } from '../tracking/tracking.bus';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import {
  ACTIVE_STATUSES,
  ALLOWED_TRANSITIONS,
  MIN_LEAD_TIME_MIN,
  STATUS_MESSAGE,
  buildAppointmentCode,
  isWithinBusinessHours,
  overlaps,
} from './scheduling';

const DETAIL_INCLUDE = {
  service: true,
  workshop: true,
  vehicle: { select: { id: true, plate: true, brand: true, model: true } },
  events: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.AppointmentInclude;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicles: VehiclesService,
    private readonly bus: TrackingBus,
  ) {}

  findAll(userId: string, status?: AppointmentStatus) {
    return this.prisma.appointment.findMany({
      where: { vehicle: { ownerId: userId }, status },
      orderBy: { scheduledAt: 'desc' },
      include: DETAIL_INCLUDE,
    });
  }

  /** Historial: solo lo que ya ocurrió, que es lo que muestra la pestaña «Historial». */
  findHistory(userId: string) {
    return this.prisma.appointment.findMany({
      where: {
        vehicle: { ownerId: userId },
        status: { in: [AppointmentStatus.COMPLETADA, AppointmentStatus.CANCELADA] },
      },
      orderBy: { scheduledAt: 'desc' },
      include: DETAIL_INCLUDE,
    });
  }

  async findOne(userId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, vehicle: { ownerId: userId } },
      include: DETAIL_INCLUDE,
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  async create(userId: string, dto: CreateAppointmentDto, now: Date = new Date()) {
    await this.vehicles.findOne(userId, dto.vehicleId);

    const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
    if (!service || !service.active) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const workshop = await this.prisma.workshop.findUnique({ where: { id: dto.workshopId } });
    if (!workshop) {
      throw new NotFoundException('Taller no encontrado');
    }

    const scheduledAt = new Date(dto.scheduledAt);

    if (scheduledAt.getTime() - now.getTime() < MIN_LEAD_TIME_MIN * 60_000) {
      throw new BadRequestException(
        `La cita debe agendarse con al menos ${MIN_LEAD_TIME_MIN} minutos de anticipación`,
      );
    }

    if (!isWithinBusinessHours(scheduledAt, service.durationMin)) {
      throw new BadRequestException(
        'El taller atiende de lunes a sábado entre 7:00 a. m. y 6:00 p. m., y el servicio debe alcanzar a terminar ese mismo día',
      );
    }

    await this.assertSlotIsFree(dto.workshopId, scheduledAt, service.durationMin);

    return this.prisma.appointment.create({
      data: {
        code: buildAppointmentCode(),
        vehicleId: dto.vehicleId,
        serviceId: service.id,
        workshopId: workshop.id,
        scheduledAt,
        totalCop: service.priceCop,
        notes: dto.notes,
        events: {
          create: {
            status: AppointmentStatus.PENDIENTE,
            message: STATUS_MESSAGE.PENDIENTE,
          },
        },
      },
      include: DETAIL_INCLUDE,
    });
  }

  async updateStatus(userId: string, id: string, dto: UpdateStatusDto) {
    const appointment = await this.findOne(userId, id);

    if (!ALLOWED_TRANSITIONS[appointment.status].includes(dto.status)) {
      throw new ConflictException(
        `No se puede pasar de ${appointment.status} a ${dto.status}`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id },
        data: { status: dto.status },
        include: DETAIL_INCLUDE,
      }),
      this.prisma.trackingEvent.create({
        data: {
          appointmentId: id,
          status: dto.status,
          message: dto.message ?? STATUS_MESSAGE[dto.status],
        },
      }),
    ]);

    this.bus.publish({
      appointmentId: id,
      code: updated.code,
      status: updated.status,
      message: dto.message ?? STATUS_MESSAGE[dto.status],
      at: new Date().toISOString(),
    });

    return updated;
  }

  cancel(userId: string, id: string) {
    return this.updateStatus(userId, id, { status: AppointmentStatus.CANCELADA });
  }

  /**
   * Un taller no puede tener dos servicios solapados. Se comparan en memoria
   * porque la duración vive en el servicio y Prisma no permite comparar campos
   * de tablas relacionadas dentro del `where`.
   */
  private async assertSlotIsFree(workshopId: string, start: Date, durationMin: number) {
    const dayStart = new Date(start);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const sameDay = await this.prisma.appointment.findMany({
      where: {
        workshopId,
        status: { in: ACTIVE_STATUSES },
        scheduledAt: { gte: dayStart, lt: dayEnd },
      },
      include: { service: { select: { durationMin: true } } },
    });

    const clash = sameDay.find((existing) =>
      overlaps(start, durationMin, existing.scheduledAt, existing.service.durationMin),
    );

    if (clash) {
      throw new ConflictException('Ese horario ya está ocupado en el taller. Elige otro.');
    }
  }
}
