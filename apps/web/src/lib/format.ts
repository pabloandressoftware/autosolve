import type { AppointmentStatus, ServiceCategory, Urgency } from '../types';

const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatCop(value: number): string {
  // Intl inserta un espacio duro tras el símbolo ($ 80.000); el prototipo lo
  // muestra pegado ($80.000), que es como se escribe en Colombia.
  return currency.format(value).replace(/\s/gu, '');
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatDateTime(iso: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatTime(iso: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(
    new Date(iso),
  );
}

export const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  TALLER_AUTORIZADO: 'Taller Autorizado',
  SEGURIDAD_VIAL: 'Seguridad Vial',
  RENDIMIENTO_OPTIMO: 'Rendimiento Óptimo',
  MANTENIMIENTO_PREVENTIVO: 'Mantenimiento Preventivo',
  INSPECCION_RAPIDA: 'Inspección Rápida',
  SEGURIDAD_Y_VIDA_UTIL: 'Seguridad y Vida Útil',
};

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};

/** Clases de color por estado, para que el estado se lea sin tener que leerlo. */
export const STATUS_TONE: Record<AppointmentStatus, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMADA: 'bg-sky-50 text-sky-700 border-sky-200',
  EN_PROCESO: 'bg-brand-50 text-brand-700 border-brand-200',
  COMPLETADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADA: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  ALTA: 'Urgente',
  MEDIA: 'Esta semana',
  BAJA: 'Sin prisa',
};

export const URGENCY_TONE: Record<Urgency, string> = {
  ALTA: 'bg-red-50 text-red-700 border-red-200',
  MEDIA: 'bg-amber-50 text-amber-700 border-amber-200',
  BAJA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};
