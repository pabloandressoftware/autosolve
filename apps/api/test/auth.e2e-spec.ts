import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, uniqueEmail } from './helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = uniqueEmail('auth');

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: '@e2e.autosolve.co' } } });
    await app.close();
  });

  it('registra un usuario y devuelve un token utilizable', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Segura123', fullName: 'Valentina Gómez' })
      .expect(201);

    expect(register.body.accessToken).toEqual(expect.any(String));
    expect(register.body.user).not.toHaveProperty('passwordHash');

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .expect(200)
      .expect((res) => expect(res.body.email).toBe(email.toLowerCase()));
  });

  it('rechaza registrar el mismo correo dos veces', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Segura123', fullName: 'Otra persona' })
      .expect(409);
  });

  it('rechaza una contraseña sin números', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: uniqueEmail('weak'), password: 'solamenteletras', fullName: 'Prueba' })
      .expect(400);

    expect(res.body.message.join(' ')).toContain('número');
  });

  it('rechaza campos que no están en el DTO', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: uniqueEmail('extra'), password: 'Segura123', fullName: 'X', role: 'ADMIN' })
      .expect(400);
  });

  it('inicia sesión con las credenciales correctas', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'Segura123' })
      .expect(200);
  });

  it('rechaza una contraseña incorrecta', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'Incorrecta1' })
      .expect(401);
  });

  it('protege /me sin token y con token inválido', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer no-es-un-token')
      .expect(401);
  });
});
