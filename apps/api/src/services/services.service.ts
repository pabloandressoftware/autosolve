import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { QueryServicesDto } from './dto/query-services.dto';

/** Cuántos servicios muestra la sección «Servicios recomendados» del inicio. */
const RECOMMENDED_COUNT = 3;

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll({ q, category, limit }: QueryServicesDto) {
    const where: Prisma.ServiceWhereInput = { active: true };

    if (category) {
      where.category = category;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { symptoms: { some: { keywords: { has: q.toLowerCase() } } } },
      ];
    }

    return this.prisma.service.findMany({
      where,
      orderBy: { priceCop: 'asc' },
      take: limit,
    });
  }

  async findBySlug(slug: string) {
    const service = await this.prisma.service.findUnique({
      where: { slug },
      include: { symptoms: { select: { label: true, urgency: true } } },
    });

    if (!service || !service.active) {
      throw new NotFoundException('Servicio no encontrado');
    }

    return service;
  }

  /**
   * Servicios sugeridos en el inicio. Si el usuario ya tiene historial, prioriza
   * los servicios que aún no ha contratado; si no, devuelve los más económicos.
   */
  async findRecommended(userId?: string) {
    if (!userId) {
      return this.prisma.service.findMany({
        where: { active: true },
        orderBy: { priceCop: 'asc' },
        take: RECOMMENDED_COUNT,
      });
    }

    const contracted = await this.prisma.appointment.findMany({
      where: { vehicle: { ownerId: userId } },
      select: { serviceId: true },
      distinct: ['serviceId'],
    });
    const contractedIds = contracted.map((a) => a.serviceId);

    const pending = await this.prisma.service.findMany({
      where: { active: true, id: { notIn: contractedIds } },
      orderBy: { priceCop: 'asc' },
      take: RECOMMENDED_COUNT,
    });

    if (pending.length === RECOMMENDED_COUNT) {
      return pending;
    }

    // Completa el cupo con servicios ya contratados (recurrentes, p. ej. el aceite).
    const filler = await this.prisma.service.findMany({
      where: { active: true, id: { in: contractedIds } },
      orderBy: { priceCop: 'asc' },
      take: RECOMMENDED_COUNT - pending.length,
    });

    return [...pending, ...filler];
  }
}
