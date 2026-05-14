import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { TrackingService, maskPlate } from './tracking.service';

const prisma = { appointment: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() } };

const appointment = {
  code: 'AS-7K3F9Q',
  status: 'EN_PROCESO',
  scheduledAt: new Date('2025-10-15T09:00:00Z'),
  service: { name: 'Revisión de Frenos', durationMin: 60 },
  workshop: { name: 'Energitéca Centro', address: 'Calle 13 # 4-52', phone: '+57 602 555 0110' },
  vehicle: { brand: 'Renault', model: 'Logan', plate: 'ABC123' },
  events: [
    {
      status: 'PENDIENTE',
      message: 'Recibimos tu solicitud.',
      createdAt: new Date('2025-10-14T10:00:00Z'),
    },
    {
      status: 'EN_PROCESO',
      message: 'El servicio comenzó.',
      createdAt: new Date('2025-10-15T09:05:00Z'),
    },
  ],
};

describe('maskPlate', () => {
  it('deja visibles las letras y el último dígito', () => {
    expect(maskPlate('ABC123')).toBe('ABC**3');
  });

  it('no enmascara placas demasiado cortas para ocultar algo', () => {
    expect(maskPlate('AB12')).toBe('AB12');
  });
});

describe('TrackingService', () => {
  let service: TrackingService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [TrackingService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(TrackingService);
  });

  it('normaliza el código a mayúsculas y sin espacios', async () => {
    prisma.appointment.findUnique.mockResolvedValue(appointment);

    await service.findByCode('  as-7k3f9q ');

    expect(prisma.appointment.findUnique.mock.calls[0][0].where.code).toBe('AS-7K3F9Q');
  });

  it('devuelve la línea de tiempo en orden', async () => {
    prisma.appointment.findUnique.mockResolvedValue(appointment);

    const result = await service.findByCode('AS-7K3F9Q');

    expect(result.timeline.map((t) => t.status)).toEqual(['PENDIENTE', 'EN_PROCESO']);
  });

  it('no expone datos personales del dueño ni la placa completa', async () => {
    prisma.appointment.findUnique.mockResolvedValue(appointment);

    const result = await service.findByCode('AS-7K3F9Q');
    const serialized = JSON.stringify(result);

    expect(result.vehicle.plate).toBe('ABC**3');
    expect(serialized).not.toContain('ABC123');
    expect(serialized).not.toContain('ownerId');
    expect(result).not.toHaveProperty('notes');
  });

  it('responde 404 con un código que no existe', async () => {
    prisma.appointment.findUnique.mockResolvedValue(null);

    await expect(service.findByCode('AS-XXXXXX')).rejects.toThrow(NotFoundException);
  });
});
