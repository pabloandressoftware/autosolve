import 'dotenv/config';

import { PrismaClient, ServiceCategory, Urgency } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Catálogo tal como se validó en el prototipo de Visily (18/09/2025). */
const services = [
  {
    slug: 'cambio-de-aceite',
    name: 'Cambio de Aceite',
    description: 'Incluye filtro y aceite sintético de alta calidad.',
    priceCop: 80_000,
    durationMin: 45,
    category: ServiceCategory.TALLER_AUTORIZADO,
    icon: 'wrench',
  },
  {
    slug: 'revision-de-frenos',
    name: 'Revisión de Frenos',
    description: 'Inspección completa y ajuste del sistema de frenado.',
    priceCop: 120_000,
    durationMin: 60,
    category: ServiceCategory.SEGURIDAD_VIAL,
    icon: 'brake',
  },
  {
    slug: 'alineacion-y-balanceo',
    name: 'Alineación y Balanceo',
    description: 'Mejora la estabilidad y el desgaste de neumáticos.',
    priceCop: 70_000,
    durationMin: 75,
    category: ServiceCategory.RENDIMIENTO_OPTIMO,
    icon: 'gauge',
  },
  {
    slug: 'diagnostico-de-bateria',
    name: 'Diagnóstico de Batería',
    description: 'Comprobación de carga, voltaje y estado general.',
    priceCop: 35_000,
    durationMin: 30,
    category: ServiceCategory.MANTENIMIENTO_PREVENTIVO,
    icon: 'battery',
  },
  {
    slug: 'revision-de-fluidos',
    name: 'Revisión de Fluidos',
    description: 'Chequeo y recarga de niveles esenciales del vehículo.',
    priceCop: 25_000,
    durationMin: 20,
    category: ServiceCategory.INSPECCION_RAPIDA,
    icon: 'droplet',
  },
  {
    slug: 'inspeccion-de-llantas',
    name: 'Inspección de Llantas',
    description: 'Revisión de presión, desgaste y rotación de neumáticos.',
    priceCop: 40_000,
    durationMin: 30,
    category: ServiceCategory.SEGURIDAD_Y_VIDA_UTIL,
    icon: 'tire',
  },
];

/**
 * Mapa síntoma → servicio que alimenta al chatbot de diagnóstico.
 * Las palabras clave son las que usaron los usuarios en la prueba piloto,
 * en lenguaje coloquial y no técnico.
 */
const symptoms = [
  {
    slug: 'chirrido-al-frenar',
    label: 'Chirrido o vibración al frenar',
    keywords: ['chirrido', 'chilla', 'rechina', 'frenar', 'freno', 'pastillas', 'vibra al frenar'],
    urgency: Urgency.ALTA,
    service: 'revision-de-frenos',
  },
  {
    slug: 'pedal-esponjoso',
    label: 'El pedal del freno se siente blando',
    keywords: ['pedal blando', 'pedal esponjoso', 'freno se hunde', 'no frena bien'],
    urgency: Urgency.ALTA,
    service: 'revision-de-frenos',
  },
  {
    slug: 'no-enciende',
    label: 'El carro no enciende o cuesta arrancar',
    keywords: ['no enciende', 'no prende', 'no arranca', 'bateria', 'batería', 'se descargó'],
    urgency: Urgency.ALTA,
    service: 'diagnostico-de-bateria',
  },
  {
    slug: 'luces-tenues',
    label: 'Las luces se ven débiles',
    keywords: ['luces débiles', 'luces tenues', 'luz baja', 'alternador'],
    urgency: Urgency.MEDIA,
    service: 'diagnostico-de-bateria',
  },
  {
    slug: 'jala-a-un-lado',
    label: 'El volante se va hacia un lado',
    keywords: ['jala', 'se va a un lado', 'volante torcido', 'vibra el volante', 'alineación'],
    urgency: Urgency.MEDIA,
    service: 'alineacion-y-balanceo',
  },
  {
    slug: 'aceite-vencido',
    label: 'Hace tiempo no cambio el aceite',
    keywords: ['aceite', 'cambio de aceite', 'motor ruidoso', 'testigo de aceite'],
    urgency: Urgency.MEDIA,
    service: 'cambio-de-aceite',
  },
  {
    slug: 'llanta-baja',
    label: 'Una llanta se ve baja o desgastada',
    keywords: ['llanta', 'neumático', 'presión', 'desgaste', 'pinchada', 'rin'],
    urgency: Urgency.MEDIA,
    service: 'inspeccion-de-llantas',
  },
  {
    slug: 'nivel-refrigerante',
    label: 'Se calienta o baja el refrigerante',
    keywords: ['refrigerante', 'se calienta', 'temperatura', 'humo', 'fluidos', 'liquido'],
    urgency: Urgency.ALTA,
    service: 'revision-de-fluidos',
  },
  {
    slug: 'mantenimiento-general',
    label: 'Solo quiero una revisión general',
    keywords: ['revisión', 'chequeo', 'mantenimiento', 'general', 'preventivo'],
    urgency: Urgency.BAJA,
    service: 'revision-de-fluidos',
  },
];

const workshops = [
  {
    name: 'Energitéca Centro',
    address: 'Calle 13 # 4-52',
    city: 'Cali',
    phone: '+57 602 555 0110',
    latitude: 3.4516,
    longitude: -76.532,
    rating: 4.7,
  },
  {
    name: 'Energitéca Norte',
    address: 'Av. 6N # 28-11',
    city: 'Cali',
    phone: '+57 602 555 0142',
    latitude: 3.4712,
    longitude: -76.5225,
    rating: 4.5,
  },
  {
    name: 'Coéxito Sur',
    address: 'Cra. 100 # 11-60',
    city: 'Cali',
    phone: '+57 602 555 0178',
    latitude: 3.3742,
    longitude: -76.5391,
    rating: 4.8,
  },
];

async function main() {
  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });
  }

  for (const { service: serviceSlug, ...symptom } of symptoms) {
    const service = await prisma.service.findUniqueOrThrow({ where: { slug: serviceSlug } });
    await prisma.symptom.upsert({
      where: { slug: symptom.slug },
      update: { ...symptom, serviceId: service.id },
      create: { ...symptom, serviceId: service.id },
    });
  }

  if ((await prisma.workshop.count()) === 0) {
    await prisma.workshop.createMany({ data: workshops });
  }

  const demo = await prisma.user.upsert({
    where: { email: 'demo@autosolve.co' },
    update: {},
    create: {
      email: 'demo@autosolve.co',
      passwordHash: await bcrypt.hash('Demo1234!', 10),
      fullName: 'Camila Rueda',
      phone: '+57 300 000 0000',
    },
  });

  await prisma.vehicle.upsert({
    where: { plate: 'ABC123' },
    update: {},
    create: {
      ownerId: demo.id,
      plate: 'ABC123',
      brand: 'Renault',
      model: 'Logan',
      year: 2019,
      mileageKm: 74_500,
    },
  });

  console.log(
    `Seed listo: ${services.length} servicios, ${symptoms.length} síntomas, ${workshops.length} talleres.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
