import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { Observable, Subject, filter } from 'rxjs';

export interface TrackingUpdate {
  appointmentId: string;
  code: string;
  status: AppointmentStatus;
  message: string;
  at: string;
}

/**
 * Bus en memoria que empuja los cambios de estado a los clientes conectados por
 * SSE. Es suficiente para una sola instancia; con varias réplicas habría que
 * reemplazarlo por Redis pub/sub sin tocar a los consumidores.
 */
@Injectable()
export class TrackingBus {
  private readonly updates = new Subject<TrackingUpdate>();

  publish(update: TrackingUpdate): void {
    this.updates.next(update);
  }

  /** Flujo de actualizaciones de una cita concreta. */
  streamFor(appointmentId: string): Observable<TrackingUpdate> {
    return this.updates.asObservable().pipe(filter((u) => u.appointmentId === appointmentId));
  }
}
