import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkshopsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.workshop.findMany({ orderBy: { rating: 'desc' } });
  }

  async findOne(id: string) {
    const workshop = await this.prisma.workshop.findUnique({ where: { id } });

    if (!workshop) {
      throw new NotFoundException('Taller no encontrado');
    }

    return workshop;
  }
}
