import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AutoSolve API')
    .setDescription(
      'API de diagnóstico, agendamiento y seguimiento de servicios automotrices. ' +
        'Equipo Morado — Universidad Icesi.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Registro, inicio de sesión y perfil')
    .addTag('vehicles', 'Vehículos del conductor')
    .addTag('services', 'Catálogo de servicios')
    .addTag('appointments', 'Agendamiento de citas')
    .addTag('chat', 'Chatbot de diagnóstico')
    .addTag('tracking', 'Seguimiento en tiempo real')
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config), {
    swaggerOptions: { persistAuthorization: true },
  });
}
