import { AppointmentStatus } from '@prisma/client';

/** Horario de atención de los talleres aliados, hora local de Colombia. */
export const OPENING_HOUR = 7;
export const CLOSING_HOUR = 18;

/** Con cuánta anticipación mínima se puede agendar. */
export const MIN_LEAD_TIME_MIN = 60;

/** Transiciones válidas del estado de una cita. */
export const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDIENTE: [AppointmentStatus.CONFIRMADA, AppointmentStatus.CANCELADA],
  CONFIRMADA: [AppointmentStatus.EN_PROCESO, AppointmentStatus.CANCELADA],
  EN_PROCESO: [AppointmentStatus.COMPLETADA],
  COMPLETADA: [],
  CANCELADA: [],
};

export const STATUS_MESSAGE: Record<AppointmentStatus, string> = {
  PENDIENTE: 'Recibimos tu solicitud. El taller la confirmará en breve.',
  CONFIRMADA: 'El taller confirmó tu cita. Te esperamos a la hora acordada.',
  EN_PROCESO: 'Tu vehículo está en el taller y el servicio ya comenzó.',
  COMPLETADA: 'El servicio terminó. Tu vehículo está listo para recoger.',
  CANCELADA: 'La cita fue cancelada.',
};

/** Estados en los que la cita todavía ocupa un cupo en la agenda del taller. */
export const ACTIVE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PENDIENTE,
  AppointmentStatus.CONFIRMADA,
  AppointmentStatus.EN_PROCESO,
];

export function isWithinBusinessHours(start: Date, durationMin: number): boolean {
  const end = new Date(start.getTime() + durationMin * 60_000);
  const day = start.getDay();

  // Domingo cerrado.
  if (day === 0) {
    return false;
  }

  // El servicio debe empezar y terminar el mismo día, dentro del horario.
  return (
    start.getHours() >= OPENING_HOUR &&
    end.getDate() === start.getDate() &&
    (end.getHours() < CLOSING_HOUR || (end.getHours() === CLOSING_HOUR && end.getMinutes() === 0))
  );
}

export function overlaps(aStart: Date, aMin: number, bStart: Date, bMin: number): boolean {
  const aEnd = aStart.getTime() + aMin * 60_000;
  const bEnd = bStart.getTime() + bMin * 60_000;
  return aStart.getTime() < bEnd && bStart.getTime() < aEnd;
}

/** Código legible que el usuario ve en la pantalla de seguimiento (AS-7K3F9Q). */
export function buildAppointmentCode(random: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(random() * alphabet.length)];
  }
  return `AS-${code}`;
}
