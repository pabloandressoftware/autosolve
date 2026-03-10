import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MessageRole, Urgency } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ChatbotService } from './chatbot.service';
import { DiagnosisEngine } from './diagnosis.engine';

const prisma = {
  chatSession: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  chatMessage: { create: jest.fn() },
  symptom: { findMany: jest.fn() },
  service: { findUniqueOrThrow: jest.fn() },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
};

const vehicles = { findOne: jest.fn() };

const frenos = {
  id: 'srv-frenos',
  name: 'Revisión de Frenos',
  description: 'Inspección completa del sistema de frenado.',
  priceCop: 120000,
  durationMin: 60,
};

describe('ChatbotService', () => {
  let service: ChatbotService;

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((ops: unknown[]) => Promise.all(ops));

    const moduleRef = await Test.createTestingModule({
      providers: [
        ChatbotService,
        DiagnosisEngine,
        { provide: PrismaService, useValue: prisma },
        { provide: VehiclesService, useValue: vehicles },
      ],
    }).compile();

    service = moduleRef.get(ChatbotService);
    prisma.chatSession.findFirst.mockResolvedValue({ id: 's1', userId: 'u1' });
    prisma.symptom.findMany.mockResolvedValue([
      {
        slug: 'chirrido-al-frenar',
        label: 'Chirrido o vibración al frenar',
        keywords: ['chirrido', 'frenar'],
        urgency: Urgency.ALTA,
        serviceId: 'srv-frenos',
      },
    ]);
  });

  it('valida que el vehículo sea del usuario antes de abrir la conversación', async () => {
    vehicles.findOne.mockRejectedValue(new NotFoundException());

    await expect(service.start('u1', { vehicleId: 'v-ajeno' })).rejects.toThrow(NotFoundException);
    expect(prisma.chatSession.create).not.toHaveBeenCalled();
  });

  it('rechaza escribir en una conversación de otro usuario', async () => {
    prisma.chatSession.findFirst.mockResolvedValue(null);

    await expect(service.sendMessage('u1', 's-ajena', { content: 'hola' })).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.chatMessage.create).not.toHaveBeenCalled();
  });

  it('guarda el mensaje del usuario y responde con la recomendación', async () => {
    prisma.service.findUniqueOrThrow.mockResolvedValue(frenos);
    prisma.chatMessage.create.mockImplementation(({ data }: { data: { content: string } }) =>
      Promise.resolve({ id: 'm', ...data }),
    );

    const result = await service.sendMessage('u1', 's1', { content: 'chirrido al frenar' });

    expect(prisma.chatMessage.create).toHaveBeenCalledWith({
      data: { sessionId: 's1', role: MessageRole.USER, content: 'chirrido al frenar' },
    });
    expect(result.recommendation?.service).toBe(frenos);
    expect(result.recommendation?.urgency).toBe(Urgency.ALTA);
    expect(result.reply.content).toContain('Revisión de Frenos');
    expect(result.reply.content).toContain('$120.000');
    expect(result.reply.content).toContain('agendar hoy mismo');
  });

  it('persiste el servicio recomendado en la sesión para poder agendarlo', async () => {
    prisma.service.findUniqueOrThrow.mockResolvedValue(frenos);
    prisma.chatMessage.create.mockResolvedValue({ id: 'm', content: '' });

    await service.sendMessage('u1', 's1', { content: 'un chirrido raro' });

    expect(prisma.chatSession.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { recommendedServiceId: 'srv-frenos', urgency: Urgency.ALTA },
    });
  });

  it('pide más detalle y ofrece opciones cuando no reconoce la falla', async () => {
    prisma.chatMessage.create.mockImplementation(({ data }: { data: { content: string } }) =>
      Promise.resolve({ id: 'm', ...data }),
    );
    prisma.symptom.findMany.mockResolvedValueOnce([
      {
        slug: 'chirrido-al-frenar',
        label: 'Chirrido',
        keywords: ['chirrido'],
        urgency: Urgency.ALTA,
        serviceId: 'srv-frenos',
      },
    ]);
    prisma.symptom.findMany.mockResolvedValueOnce([{ slug: 'chirrido-al-frenar', label: 'Chirrido' }]);

    const result = await service.sendMessage('u1', 's1', { content: 'cual es el horario' });

    expect(result.recommendation).toBeNull();
    expect(result.reply.content).toContain('No logré identificar la falla');
    expect(result.suggestions).toHaveLength(1);
    expect(prisma.chatSession.update).not.toHaveBeenCalled();
  });
});
