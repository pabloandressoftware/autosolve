import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageRole, Urgency } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { DiagnosisEngine, SymptomRule } from './diagnosis.engine';
import { SendMessageDto, StartSessionDto } from './dto/send-message.dto';

const GREETING =
  'Hola, soy AutoSolve. Cuéntame en tus palabras qué le pasa a tu carro — por ejemplo «suena un chirrido al frenar».';

const FALLBACK =
  'No logré identificar la falla con eso. ¿Puedes describir qué escuchas, ves o sientes al manejar? Si prefieres, elige una de las opciones de abajo.';

const URGENCY_COPY: Record<Urgency, string> = {
  ALTA: 'Es mejor no dejarlo pasar: te recomiendo agendar hoy mismo.',
  MEDIA: 'No es urgente, pero conviene revisarlo esta semana.',
  BAJA: 'Puedes agendarlo con calma cuando te quede cómodo.',
};

@Injectable()
export class ChatbotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: DiagnosisEngine,
    private readonly vehicles: VehiclesService,
  ) {}

  async start(userId: string, dto: StartSessionDto) {
    if (dto.vehicleId) {
      await this.vehicles.findOne(userId, dto.vehicleId);
    }

    const session = await this.prisma.chatSession.create({
      data: {
        userId,
        vehicleId: dto.vehicleId,
        messages: { create: { role: MessageRole.BOT, content: GREETING } },
      },
      include: { messages: true },
    });

    return { ...session, suggestions: await this.suggestions() };
  }

  async history(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        recommendedService: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Conversación no encontrada');
    }

    return session;
  }

  async listSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { recommendedService: { select: { slug: true, name: true } } },
    });
  }

  async sendMessage(userId: string, sessionId: string, dto: SendMessageDto) {
    await this.history(userId, sessionId);

    await this.prisma.chatMessage.create({
      data: { sessionId, role: MessageRole.USER, content: dto.content },
    });

    const rules = await this.rules();
    const diagnosis = this.engine.best(dto.content, rules);

    if (!diagnosis) {
      const reply = await this.prisma.chatMessage.create({
        data: { sessionId, role: MessageRole.BOT, content: FALLBACK },
      });

      return { reply, recommendation: null, suggestions: await this.suggestions() };
    }

    const service = await this.prisma.service.findUniqueOrThrow({
      where: { id: diagnosis.symptom.serviceId },
    });

    const content = [
      `Por lo que describes, suena a: ${diagnosis.symptom.label.toLowerCase()}.`,
      `Te recomiendo ${service.name} — ${service.description}`,
      `Cuesta $${service.priceCop.toLocaleString('es-CO')} y toma unos ${service.durationMin} minutos.`,
      URGENCY_COPY[diagnosis.symptom.urgency],
    ].join(' ');

    const [reply] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({ data: { sessionId, role: MessageRole.BOT, content } }),
      this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { recommendedServiceId: service.id, urgency: diagnosis.symptom.urgency },
      }),
    ]);

    return {
      reply,
      recommendation: {
        service,
        symptom: diagnosis.symptom.label,
        urgency: diagnosis.symptom.urgency,
        matched: diagnosis.matched,
      },
      suggestions: [],
    };
  }

  private async rules(): Promise<SymptomRule[]> {
    return this.prisma.symptom.findMany({
      select: { slug: true, label: true, keywords: true, urgency: true, serviceId: true },
    });
  }

  /** Chips que el usuario puede tocar en vez de escribir, ordenados por urgencia. */
  private async suggestions() {
    const symptoms = await this.prisma.symptom.findMany({
      select: { slug: true, label: true, urgency: true },
      orderBy: { urgency: 'asc' },
      take: 4,
    });

    return symptoms;
  }
}
