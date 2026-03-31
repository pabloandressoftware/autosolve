import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppointmentStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { TrackingBus } from '../tracking/tracking.bus';
import { VehiclesService } from '../vehicles/vehicles.service';
import { AppointmentsService } from './appointments.service';

const prisma = {
  appointment: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  trackingEvent: { create: jest.fn() },
  service: { findUnique: jest.fn() },
  workshop: { findUnique: jest.fn() },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
};

const vehicles = { findOne: jest.fn() };
const bus = { publish: jest.fn() };

const NOW = new Date('2025-10-08T08:00:00'); // miércoles
const dto = {
  vehicleId: 'v1',
  serviceId: 's1',
  workshopId: 'w1',
  scheduledAt: new Date('2025-10-08T10:00:00'),
};

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((ops: unknown[]) => Promise.all(ops));

    const moduleRef = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: VehiclesService, useValue: vehicles },
        { provide: TrackingBus, useValue: bus },
      ],
    }).compile();

    service = moduleRef.get(AppointmentsService);
    vehicles.findOne.mockResolvedValue({ id: 'v1' });
    prisma.service.findUnique.mockResolvedValue({ id: 's1', active: true, durationMin: 60, priceCop: 120000 });
    prisma.workshop.findUnique.mockResolvedValue({ id: 'w1' });
    prisma.appointment.findMany.mockResolvedValue([]);
    prisma.appointment.create.mockImplementation(({ data }: { data: unknown }) =>
      Promise.resolve({ id: 'a1', ...(data as object) }),
    );
  });

  describe('create', () => {
    it('agenda la cita y abre la bitácora de seguimiento en PENDIENTE', async () => {
      await service.create('u1', dto, NOW);

      const { data } = prisma.appointment.create.mock.calls[0][0];
      expect(data.code).toMatch(/^AS-/);
      expect(data.totalCop).toBe(120000);
      expect(data.events.create.status).toBe(AppointmentStatus.PENDIENTE);
    });

    it('congela el precio del servicio en la cita', async () => {
      await service.create('u1', dto, NOW);

      expect(prisma.appointment.create.mock.calls[0][0].data.totalCop).toBe(120000);
    });

    it('rechaza agendar con menos de una hora de anticipación', async () => {
      await expect(
        service.create('u1', { ...dto, scheduledAt: new Date('2025-10-08T08:30:00') }, NOW),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un horario fuera del horario de atención', async () => {
      await expect(
        service.create('u1', { ...dto, scheduledAt: new Date('2025-10-08T17:30:00') }, NOW),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza el cupo cuando el taller ya tiene un servicio solapado', async () => {
      prisma.appointment.findMany.mockResolvedValue([
        { scheduledAt: new Date('2025-10-08T10:30:00'), service: { durationMin: 45 } },
      ]);

      await expect(service.create('u1', dto, NOW)).rejects.toThrow(ConflictException);
    });

    it('acepta el cupo inmediatamente siguiente al de otra cita', async () => {
      prisma.appointment.findMany.mockResolvedValue([
        { scheduledAt: new Date('2025-10-08T09:00:00'), service: { durationMin: 60 } },
      ]);

      await expect(service.create('u1', dto, NOW)).resolves.toBeDefined();
    });

    it('ignora las citas canceladas al buscar solapamientos', async () => {
      await service.create('u1', dto, NOW);

      expect(prisma.appointment.findMany.mock.calls[0][0].where.status.in).toEqual([
        'PENDIENTE',
        'CONFIRMADA',
        'EN_PROCESO',
      ]);
    });

    it('no agenda sobre un vehículo ajeno', async () => {
      vehicles.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create('u1', dto, NOW)).rejects.toThrow(NotFoundException);
      expect(prisma.appointment.create).not.toHaveBeenCalled();
    });

    it('rechaza un servicio inactivo', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 's1', active: false, durationMin: 60, priceCop: 1 });

      await expect(service.create('u1', dto, NOW)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('registra un evento de seguimiento al cambiar de estado', async () => {
      prisma.appointment.findFirst.mockResolvedValue({ id: 'a1', status: 'PENDIENTE' });
      prisma.appointment.update.mockResolvedValue({ id: 'a1', status: 'CONFIRMADA' });

      await service.updateStatus('u1', 'a1', { status: AppointmentStatus.CONFIRMADA });

      expect(prisma.trackingEvent.create).toHaveBeenCalledWith({
        data: {
          appointmentId: 'a1',
          status: 'CONFIRMADA',
          message: 'El taller confirmó tu cita. Te esperamos a la hora acordada.',
        },
      });
    });

    it('publica la actualización en el bus de seguimiento en tiempo real', async () => {
      prisma.appointment.findFirst.mockResolvedValue({ id: 'a1', status: 'CONFIRMADA' });
      prisma.appointment.update.mockResolvedValue({ id: 'a1', code: 'AS-7K3F9Q', status: 'EN_PROCESO' });

      await service.updateStatus('u1', 'a1', { status: AppointmentStatus.EN_PROCESO });

      expect(bus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ appointmentId: 'a1', code: 'AS-7K3F9Q', status: 'EN_PROCESO' }),
      );
    });

    it('no publica nada cuando la transición es inválida', async () => {
      prisma.appointment.findFirst.mockResolvedValue({ id: 'a1', status: 'PENDIENTE' });

      await expect(
        service.updateStatus('u1', 'a1', { status: AppointmentStatus.COMPLETADA }),
      ).rejects.toThrow(ConflictException);
      expect(bus.publish).not.toHaveBeenCalled();
    });

    it('rechaza una transición inválida', async () => {
      prisma.appointment.findFirst.mockResolvedValue({ id: 'a1', status: 'PENDIENTE' });

      await expect(
        service.updateStatus('u1', 'a1', { status: AppointmentStatus.COMPLETADA }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.appointment.update).not.toHaveBeenCalled();
    });

    it('no permite cancelar una cita ya completada', async () => {
      prisma.appointment.findFirst.mockResolvedValue({ id: 'a1', status: 'COMPLETADA' });

      await expect(service.cancel('u1', 'a1')).rejects.toThrow(ConflictException);
    });
  });

  it('el historial solo trae citas completadas o canceladas', async () => {
    await service.findHistory('u1');

    expect(prisma.appointment.findMany.mock.calls[0][0].where.status).toEqual({
      in: ['COMPLETADA', 'CANCELADA'],
    });
  });
});
