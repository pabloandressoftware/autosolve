import { AppointmentStatus } from '@prisma/client';

import {
  ALLOWED_TRANSITIONS,
  buildAppointmentCode,
  isWithinBusinessHours,
  overlaps,
} from './scheduling';

/** 2025-10-08 es miércoles; 2025-10-12 es domingo. */
const at = (iso: string) => new Date(iso);

describe('isWithinBusinessHours', () => {
  it('acepta un servicio que empieza y termina dentro del horario', () => {
    expect(isWithinBusinessHours(at('2025-10-08T09:00:00'), 60)).toBe(true);
  });

  it('acepta un servicio que termina justo a las 6:00 p. m.', () => {
    expect(isWithinBusinessHours(at('2025-10-08T17:00:00'), 60)).toBe(true);
  });

  it('rechaza un servicio que se pasa de la hora de cierre', () => {
    expect(isWithinBusinessHours(at('2025-10-08T17:30:00'), 60)).toBe(false);
  });

  it('rechaza un servicio antes de la apertura', () => {
    expect(isWithinBusinessHours(at('2025-10-08T06:30:00'), 30)).toBe(false);
  });

  it('rechaza los domingos', () => {
    expect(isWithinBusinessHours(at('2025-10-12T10:00:00'), 30)).toBe(false);
  });

  it('acepta los sábados', () => {
    expect(isWithinBusinessHours(at('2025-10-11T10:00:00'), 30)).toBe(true);
  });
});

describe('overlaps', () => {
  it('detecta el solapamiento cuando una cita empieza dentro de otra', () => {
    expect(overlaps(at('2025-10-08T09:00:00'), 60, at('2025-10-08T09:30:00'), 30)).toBe(true);
  });

  it('permite una cita que empieza justo cuando termina la anterior', () => {
    expect(overlaps(at('2025-10-08T09:00:00'), 60, at('2025-10-08T10:00:00'), 30)).toBe(false);
  });

  it('permite citas en horas distintas', () => {
    expect(overlaps(at('2025-10-08T09:00:00'), 45, at('2025-10-08T14:00:00'), 60)).toBe(false);
  });
});

describe('ALLOWED_TRANSITIONS', () => {
  it('no permite salir de un estado terminal', () => {
    expect(ALLOWED_TRANSITIONS[AppointmentStatus.COMPLETADA]).toEqual([]);
    expect(ALLOWED_TRANSITIONS[AppointmentStatus.CANCELADA]).toEqual([]);
  });

  it('no permite cancelar una cita que ya está en proceso', () => {
    expect(ALLOWED_TRANSITIONS[AppointmentStatus.EN_PROCESO]).not.toContain(
      AppointmentStatus.CANCELADA,
    );
  });

  it('no permite saltar de pendiente a completada', () => {
    expect(ALLOWED_TRANSITIONS[AppointmentStatus.PENDIENTE]).not.toContain(
      AppointmentStatus.COMPLETADA,
    );
  });
});

describe('buildAppointmentCode', () => {
  it('usa el prefijo AS- y seis caracteres', () => {
    expect(buildAppointmentCode(() => 0)).toMatch(/^AS-[A-Z2-9]{6}$/);
  });

  it('excluye caracteres que se confunden al leer (I, L, O, 0, 1)', () => {
    const codes = Array.from({ length: 200 }, () => buildAppointmentCode());

    expect(codes.map((code) => code.slice(3)).join('')).not.toMatch(/[ILO01]/);
  });
});
