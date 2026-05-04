import { ArrowLeft, MapPin, Phone, Radio } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { StatusPill } from '../components/StatusPill';
import { Timeline } from '../components/Timeline';
import { ErrorState, Spinner } from '../components/feedback';
import { api } from '../lib/api';
import { formatCop, formatDateTime } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { useLiveTracking } from '../lib/useLiveTracking';
import type { Appointment } from '../types';

export function AppointmentDetailPage() {
  const { id = '' } = useParams();
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data, error, loading, reload } = useAsync<Appointment>(
    (signal) => api<Appointment>(`/appointments/${id}`, { signal }),
    [id],
  );

  const { updates, connected } = useLiveTracking(data?.code);

  // Cada actualización que llega por SSE se refleja recargando el detalle, que
  // es más simple y seguro que reconstruir el estado a mano en el cliente.
  useEffect(() => {
    if (updates.length > 0) {
      reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updates.length]);

  async function cancel() {
    if (!data) return;
    setCancelling(true);
    setCancelError(null);

    try {
      await api(`/appointments/${data.id}`, { method: 'DELETE' });
      reload();
    } catch (cause) {
      setCancelError((cause as Error).message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const cancellable = data.status === 'PENDIENTE' || data.status === 'CONFIRMADA';

  return (
    <div className="space-y-5">
      <Link to="/citas" className="inline-flex items-center gap-1 text-sm text-ink-muted">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Mis citas
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold leading-tight tracking-tight">{data.service.name}</h1>
          <p className="mt-1 font-mono text-xs text-ink-faint">{data.code}</p>
        </div>
        <StatusPill status={data.status} />
      </header>

      <div className="card divide-y divide-hairline">
        <Row label="Fecha" value={formatDateTime(data.scheduledAt)} />
        <Row label="Vehículo" value={`${data.vehicle.brand} ${data.vehicle.model} · ${data.vehicle.plate}`} />
        <Row label="Total" value={formatCop(data.totalCop)} />
      </div>

      <section className="card p-4">
        <h2 className="text-sm font-semibold">{data.workshop.name}</h2>
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {data.workshop.address}, {data.workshop.city}
        </p>
        <a
          href={`tel:${data.workshop.phone.replace(/\s/g, '')}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600"
        >
          <Phone className="h-4 w-4" aria-hidden />
          Llamar al taller
        </a>
      </section>

      {data.notes && (
        <section className="card p-4">
          <h2 className="text-xs uppercase tracking-wide text-ink-faint">Tus notas</h2>
          <p className="mt-1.5 text-sm text-ink-muted">{data.notes}</p>
        </section>
      )}

      <section aria-labelledby="seguimiento">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="seguimiento" className="text-sm font-semibold">
            Seguimiento
          </h2>

          {connected && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
              <Radio className="h-3.5 w-3.5" aria-hidden />
              En vivo
            </span>
          )}
        </div>

        <div className="card p-4">
          <Timeline
            items={data.events.map((event) => ({
              status: event.status,
              message: event.message,
              at: event.createdAt,
            }))}
          />
        </div>
      </section>

      {cancelError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {cancelError}
        </p>
      )}

      {cancellable && (
        <button type="button" className="btn-ghost w-full" onClick={cancel} disabled={cancelling}>
          {cancelling ? 'Cancelando…' : 'Cancelar cita'}
        </button>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <span className="text-xs uppercase tracking-wide text-ink-faint">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
