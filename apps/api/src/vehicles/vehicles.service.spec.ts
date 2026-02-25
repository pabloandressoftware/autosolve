import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { VehiclesService } from './vehicles.service';

const prisma = {
  vehicle: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const duplicatePlate = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
  code: 'P2002',
  clientVersion: '5.20.0',
});

describe('VehiclesService', () => {
  let service: VehiclesService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [VehiclesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(VehiclesService);
  });

  it('lista solo los vehículos del usuario autenticado', async () => {
    prisma.vehicle.findMany.mockResolvedValue([]);

    await service.findAll('u1');

    expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: 'u1' } }),
    );
  });

  it('reporta 404 cuando el vehículo pertenece a otro usuario', async () => {
    prisma.vehicle.findFirst.mockResolvedValue(null);

    await expect(service.findOne('u1', 'v-ajeno')).rejects.toThrow(NotFoundException);
  });

  it('no permite actualizar un vehículo ajeno', async () => {
    prisma.vehicle.findFirst.mockResolvedValue(null);

    await expect(service.update('u1', 'v-ajeno', { brand: 'Mazda' })).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.vehicle.update).not.toHaveBeenCalled();
  });

  it('no permite eliminar un vehículo ajeno', async () => {
    prisma.vehicle.findFirst.mockResolvedValue(null);

    await expect(service.remove('u1', 'v-ajeno')).rejects.toThrow(NotFoundException);
    expect(prisma.vehicle.delete).not.toHaveBeenCalled();
  });

  it('traduce la placa duplicada a un 409 con mensaje claro', async () => {
    prisma.vehicle.create.mockRejectedValue(duplicatePlate);

    await expect(
      service.create('u1', { plate: 'ABC123', brand: 'Renault', model: 'Logan', year: 2019 }),
    ).rejects.toThrow(new ConflictException('Esa placa ya está registrada'));
  });
});
