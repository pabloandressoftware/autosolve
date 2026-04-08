import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, nextBusinessDayAt, uniqueEmail, uniquePlate } from './helpers';

/**
 * Recorre el flujo principal que se validó con usuarios en el prototipo:
 * registro → vehículo → diagnóstico por chat → agendamiento → seguimiento.
 */
describe('Flujo completo diagnóstico → agendamiento → seguimiento (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<INestApplication['getHttpServer']>;

  let token: string;
  let vehicleId: string;
  let workshopId: string;
  let recommendedServiceId: string;
  let appointmentId: string;
  let appointmentCode: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    http = app.getHttpServer();

    const { body } = await request(http)
      .post('/api/auth/register')
      .send({ email: uniqueEmail('flujo'), password: 'Segura123', fullName: 'Mariana De La Cruz' })
      .expect(201);

    token = body.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: '@e2e.autosolve.co' } } });
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('1. registra el vehículo del conductor', async () => {
    const { body } = await request(http)
      .post('/api/vehicles')
      .set(auth())
      .send({ plate: uniquePlate(), brand: 'Mazda', model: '3', year: 2021, mileageKm: 42000 })
      .expect(201);

    vehicleId = body.id;
    expect(body.mileageKm).toBe(42000);
  });

  it('2. el chatbot identifica la falla y recomienda un servicio', async () => {
    const { body: session } = await request(http)
      .post('/api/chat/sessions')
      .set(auth())
      .send({ vehicleId })
      .expect(201);

    expect(session.messages).toHaveLength(1);
    expect(session.suggestions.length).toBeGreaterThan(0);

    const { body } = await request(http)
      .post(`/api/chat/sessions/${session.id}/messages`)
      .set(auth())
      .send({ content: 'cuando freno se escucha un chirrido muy feo' })
      .expect(201);

    expect(body.recommendation).not.toBeNull();
    expect(body.recommendation.service.slug).toBe('revision-de-frenos');
    expect(body.recommendation.urgency).toBe('ALTA');

    recommendedServiceId = body.recommendation.service.id;
  });

  it('3. agenda la cita en un taller aliado', async () => {
    const { body: workshops } = await request(http).get('/api/workshops').expect(200);
    workshopId = workshops[0].id;

    const { body } = await request(http)
      .post('/api/appointments')
      .set(auth())
      .send({
        vehicleId,
        serviceId: recommendedServiceId,
        workshopId,
        scheduledAt: nextBusinessDayAt(8, 3),
        notes: 'Suena más en bajadas',
      })
      .expect(201);

    appointmentId = body.id;
    appointmentCode = body.code;

    expect(body.status).toBe('PENDIENTE');
    expect(body.code).toMatch(/^AS-[A-Z2-9]{6}$/);
    expect(body.events).toHaveLength(1);
  });

  it('4. rechaza otra cita en el mismo cupo del taller', async () => {
    await request(http)
      .post('/api/appointments')
      .set(auth())
      .send({
        vehicleId,
        serviceId: recommendedServiceId,
        workshopId,
        scheduledAt: nextBusinessDayAt(8, 3),
      })
      .expect(409);
  });

  it('5. avanza el estado y acumula la línea de tiempo', async () => {
    for (const status of ['CONFIRMADA', 'EN_PROCESO', 'COMPLETADA']) {
      await request(http)
        .patch(`/api/appointments/${appointmentId}/status`)
        .set(auth())
        .send({ status })
        .expect(200);
    }

    const { body } = await request(http)
      .get(`/api/appointments/${appointmentId}`)
      .set(auth())
      .expect(200);

    expect(body.events.map((e: { status: string }) => e.status)).toEqual([
      'PENDIENTE',
      'CONFIRMADA',
      'EN_PROCESO',
      'COMPLETADA',
    ]);
  });

  it('6. no permite cancelar una cita ya completada', async () => {
    await request(http).delete(`/api/appointments/${appointmentId}`).set(auth()).expect(409);
  });

  it('7. el seguimiento público muestra el avance sin exponer la placa', async () => {
    const { body } = await request(http).get(`/api/tracking/${appointmentCode}`).expect(200);

    expect(body.status).toBe('COMPLETADA');
    expect(body.timeline).toHaveLength(4);
    expect(body.vehicle.plate).toMatch(/\*/);
    expect(JSON.stringify(body)).not.toContain('Suena más en bajadas');
  });

  it('8. la cita aparece en el historial del conductor', async () => {
    const { body } = await request(http).get('/api/appointments/history').set(auth()).expect(200);

    expect(body.map((a: { id: string }) => a.id)).toContain(appointmentId);
  });

  it('9. otro conductor no puede ver la cita', async () => {
    const { body: intruso } = await request(http)
      .post('/api/auth/register')
      .send({ email: uniqueEmail('intruso'), password: 'Segura123', fullName: 'Intruso' })
      .expect(201);

    await request(http)
      .get(`/api/appointments/${appointmentId}`)
      .set({ Authorization: `Bearer ${intruso.accessToken}` })
      .expect(404);

    await request(http)
      .get(`/api/vehicles/${vehicleId}`)
      .set({ Authorization: `Bearer ${intruso.accessToken}` })
      .expect(404);
  });
});
