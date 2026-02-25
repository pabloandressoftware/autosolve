import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(ownerId: string) {
    return this.prisma.vehicle.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(ownerId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id, ownerId } });

    // Un vehículo de otro usuario se reporta como inexistente para no revelar su existencia.
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    return vehicle;
  }

  async create(ownerId: string, dto: CreateVehicleDto) {
    try {
      return await this.prisma.vehicle.create({ data: { ...dto, ownerId } });
    } catch (error) {
      throw this.translate(error);
    }
  }

  async update(ownerId: string, id: string, dto: UpdateVehicleDto) {
    await this.findOne(ownerId, id);

    try {
      return await this.prisma.vehicle.update({ where: { id }, data: dto });
    } catch (error) {
      throw this.translate(error);
    }
  }

  async remove(ownerId: string, id: string) {
    await this.findOne(ownerId, id);
    await this.prisma.vehicle.delete({ where: { id } });
    return { id };
  }

  private translate(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException('Esa placa ya está registrada');
    }
    return error;
  }
}
