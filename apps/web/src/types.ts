export type Urgency = 'ALTA' | 'MEDIA' | 'BAJA';

export type AppointmentStatus =
  | 'PENDIENTE'
  | 'CONFIRMADA'
  | 'EN_PROCESO'
  | 'COMPLETADA'
  | 'CANCELADA';

export type ServiceCategory =
  | 'TALLER_AUTORIZADO'
  | 'SEGURIDAD_VIAL'
  | 'RENDIMIENTO_OPTIMO'
  | 'MANTENIMIENTO_PREVENTIVO'
  | 'INSPECCION_RAPIDA'
  | 'SEGURIDAD_Y_VIDA_UTIL';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
}

export interface Session {
  accessToken: string;
  user: User;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  mileageKm: number;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCop: number;
  durationMin: number;
  category: ServiceCategory;
  icon: string;
}

export interface Workshop {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  rating: number;
}

export interface TrackingEvent {
  id: string;
  status: AppointmentStatus;
  message: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  code: string;
  status: AppointmentStatus;
  scheduledAt: string;
  totalCop: number;
  notes: string | null;
  service: Service;
  workshop: Workshop;
  vehicle: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model'>;
  events: TrackingEvent[];
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'BOT';
  content: string;
  createdAt: string;
}

export interface SymptomChip {
  slug: string;
  label: string;
  urgency?: Urgency;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  suggestions: SymptomChip[];
}

export interface ChatReply {
  reply: ChatMessage;
  suggestions: SymptomChip[];
  recommendation: {
    service: Service;
    symptom: string;
    urgency: Urgency;
    matched: string[];
  } | null;
}

export interface PublicTracking {
  code: string;
  status: AppointmentStatus;
  scheduledAt: string;
  service: { name: string; durationMin: number };
  workshop: { name: string; address: string; phone: string };
  vehicle: { brand: string; model: string; plate: string };
  timeline: { status: AppointmentStatus; message: string; at: string }[];
}
