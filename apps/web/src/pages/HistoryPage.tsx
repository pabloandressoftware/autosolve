import { Link } from 'react-router-dom';

import { StatusPill } from '../components/StatusPill';
import { EmptyState, ErrorState, Spinner } from '../components/feedback';
import { api } from '../lib/api';
import { formatCop, formatDateTime } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import type { Appointment } from '../types';

export function HistoryPage() {
  const { data, error, loading, reload } = useAsync<Appointment[]>(
    (signal) => api<Appointment[]>('/appointments/history', { signal }),
    [],
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const total = data?.filter((a) => a.status === 'COMPLETADA').reduce((sum, a) => sum + a.totalCop, 0) ?? 0;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold tracking-tight">Historial</h1>

      {data && data.length === 0 ? (
        <EmptyState
          title="Aún no hay historial"
          description="Aquí quedará el registro de cada servicio que le hagas a tu carro."
        />
      ) : (
        <>
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-ink-faint">Invertido en mantenimiento</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{formatCop(total)}</p>
          </div>

          <ul className="card divide-y divide-hairline">
            {data?.map((appointment) => (
              <li key={appointment.id}>
                <Link to={`/citas/${appointment.id}`} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{appointment.service.name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {formatDateTime(appointment.scheduledAt)} · {appointment.vehicle.plate}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <StatusPill status={appointment.status} />
                    <p className="mt-1.5 text-sm font-semibold">{formatCop(appointment.totalCop)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
