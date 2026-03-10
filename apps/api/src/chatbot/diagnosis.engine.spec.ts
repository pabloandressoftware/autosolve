import { Urgency } from '@prisma/client';

import { DiagnosisEngine, SymptomRule, normalize } from './diagnosis.engine';

const rules: SymptomRule[] = [
  {
    slug: 'chirrido-al-frenar',
    label: 'Chirrido o vibración al frenar',
    keywords: ['chirrido', 'frenar', 'pastillas'],
    urgency: Urgency.ALTA,
    serviceId: 'frenos',
  },
  {
    slug: 'no-enciende',
    label: 'El carro no enciende',
    keywords: ['no enciende', 'bateria', 'no arranca'],
    urgency: Urgency.ALTA,
    serviceId: 'bateria',
  },
  {
    slug: 'llanta-baja',
    label: 'Una llanta se ve baja',
    keywords: ['llanta', 'rin', 'presion'],
    urgency: Urgency.MEDIA,
    serviceId: 'llantas',
  },
  {
    slug: 'mantenimiento',
    label: 'Revisión general',
    keywords: ['revision', 'chequeo'],
    urgency: Urgency.BAJA,
    serviceId: 'fluidos',
  },
];

describe('normalize', () => {
  it('elimina tildes, mayúsculas y puntuación', () => {
    expect(normalize('¡La BATERÍA está descargada!')).toBe('la bateria esta descargada');
  });
});

describe('DiagnosisEngine', () => {
  const engine = new DiagnosisEngine();

  it('reconoce el síntoma aunque el usuario escriba sin tildes', () => {
    expect(engine.best('la bateria no da', rules)?.symptom.slug).toBe('no-enciende');
  });

  it('reconoce el síntoma aunque el usuario escriba con tildes', () => {
    expect(engine.best('la batería no da', rules)?.symptom.slug).toBe('no-enciende');
  });

  it('da más peso a una frase que a una palabra suelta', () => {
    const ranked = engine.rank('el carro no enciende y la llanta se ve rara', rules);

    expect(ranked[0].symptom.slug).toBe('no-enciende');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it('no confunde una palabra corta contenida en otra', () => {
    expect(engine.rank('el primer dia fallo', rules)).toEqual([]);
  });

  it('desempata por urgencia cuando el puntaje es igual', () => {
    const ranked = engine.rank('chirrido y llanta', rules);

    expect(ranked.map((r) => r.symptom.slug)).toEqual(['chirrido-al-frenar', 'llanta-baja']);
  });

  it('devuelve null cuando el texto no menciona ningún síntoma conocido', () => {
    expect(engine.best('quiero saber el horario de atencion', rules)).toBeNull();
  });

  it('devuelve null con texto vacío o solo signos', () => {
    expect(engine.best('   ', rules)).toBeNull();
    expect(engine.best('¿¿??', rules)).toBeNull();
  });

  it('reporta qué palabras clave dispararon el diagnóstico', () => {
    expect(engine.best('escucho un chirrido al frenar', rules)?.matched).toEqual([
      'chirrido',
      'frenar',
    ]);
  });
});
