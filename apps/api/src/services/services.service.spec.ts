import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ServicesService } from './services.service';

const prisma = {
  service: { findMany: jest.fn(), findUnique: jest.fn() },
  appointment: { findMany: jest.fn() },
};

const svc = (id: string) => ({ id, active: true });

describe('ServicesService', () => {
  let service: ServicesService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [ServicesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ServicesService);
  });

  it('busca por nombre, descripción y palabras clave de los síntomas', async () => {
    prisma.service.findMany.mockResolvedValue([]);

    await service.findAll({ q: 'Chirrido' });

    const { where } = prisma.service.findMany.mock.calls[0][0];
    expect(where.OR).toHaveLength(3);
    expect(where.OR[2]).toEqual({ symptoms: { some: { keywords: { has: 'chirrido' } } } });
  });

  it('excluye los servicios inactivos del listado', async () => {
    prisma.service.findMany.mockResolvedValue([]);

    await service.findAll({});

    expect(prisma.service.findMany.mock.calls[0][0].where.active).toBe(true);
  });

  it('trata un servicio inactivo como inexistente', async () => {
    prisma.service.findUnique.mockResolvedValue({ id: 's1', active: false });

    await expect(service.findBySlug('cambio-de-aceite')).rejects.toThrow(NotFoundException);
  });

  it('sin sesión recomienda los tres servicios más económicos', async () => {
    prisma.service.findMany.mockResolvedValue([svc('s1'), svc('s2'), svc('s3')]);

    const result = await service.findRecommended();

    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3, orderBy: { priceCop: 'asc' } }),
    );
    expect(result).toHaveLength(3);
  });

  it('con sesión prioriza servicios que el usuario aún no ha contratado', async () => {
    prisma.appointment.findMany.mockResolvedValue([{ serviceId: 's1' }]);
    prisma.service.findMany.mockResolvedValueOnce([svc('s2'), svc('s3'), svc('s4')]);

    const result = await service.findRecommended('u1');

    expect(prisma.service.findMany.mock.calls[0][0].where.id).toEqual({ notIn: ['s1'] });
    expect(result.map((s) => s.id)).toEqual(['s2', 's3', 's4']);
  });

  it('completa el cupo con servicios recurrentes cuando faltan sugerencias nuevas', async () => {
    prisma.appointment.findMany.mockResolvedValue([{ serviceId: 's1' }, { serviceId: 's2' }]);
    prisma.service.findMany
      .mockResolvedValueOnce([svc('s3')])
      .mockResolvedValueOnce([svc('s1'), svc('s2')]);

    const result = await service.findRecommended('u1');

    expect(result.map((s) => s.id)).toEqual(['s3', 's1', 's2']);
    expect(prisma.service.findMany.mock.calls[1][0].take).toBe(2);
  });
});
