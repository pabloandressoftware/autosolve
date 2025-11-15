import { CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

import { StatusPill } from '../components/StatusPill';
import { EmptyState, ErrorState, Spinner } from '../components/feedback';
import { api } from '../lib/api';
import { formatCop, formatDateTime } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import type { Appointment } from '../types';

const ACTIVE = ['PENDIENTE', 'CONFIRMADA', 'EN_PROCESO'];

export function AppointmentsPage() {
  const { data, error, loading, reload } = useAsync<Appointment[]>(
    (signal) => api<Appointment[]>('/appointments', { signal }),
    [],
  );

  const upcoming = data?.filter((appointment) => ACTIVE.includes(appointment.status)) ?? [];

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold tracking-tight">Mis citas</h1>

      {upcoming.length === 0 ? (
        <EmptyState
          title="No tienes citas activas"
          description="Cuando agendes un servicio lo verás aquí, con el avance en tiempo real."
          action={
            <Link to="/agendar" className="btn-primary">
              Agendar una cita
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {upcoming.map((appointment) => (
            <li key={appointment.id}>
              <Link
                to={`/citas/${appointment.id}`}
                className="card block p-4 transition hover:border-brand-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold">{appointment.service.name}</h2>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {appointment.vehicle.brand} {appointment.vehicle.model} ·{' '}
                      {appointment.vehicle.plate}
                    </p>
                  </div>
                  <StatusPill status={appointment.status} />
                </div>

                <dl className="mt-3 space-y-1.5 text-xs text-ink-muted">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                    <dd>{formatDateTime(appointment.scheduledAt)}</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    <dd>{appointment.workshop.name}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
                  <span className="font-mono text-xs text-ink-faint">{appointment.code}</span>
                  <span className="text-sm font-bold tracking-tight">
                    {formatCop(appointment.totalCop)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
