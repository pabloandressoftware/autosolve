import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServicesModule } from './services/services.module';
import { TrackingModule } from './tracking/tracking.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { WorkshopsModule } from './workshops/workshops.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 120 peticiones por minuto por IP: holgado para navegar, suficiente para
    // frenar fuerza bruta sobre /auth/login.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    VehiclesModule,
    ServicesModule,
    TrackingModule,
    AppointmentsModule,
    ChatbotModule,
    WorkshopsModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
