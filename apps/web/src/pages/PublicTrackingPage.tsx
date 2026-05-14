import { Radio, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Logo } from '../components/Logo';
import { StatusPill } from '../components/StatusPill';
import { Timeline } from '../components/Timeline';
import { ErrorState, Spinner } from '../components/feedback';
import { api } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { useLiveTracking } from '../lib/useLiveTracking';
import type { PublicTracking } from '../types';

/** Pantalla sin sesión: se llega con el código que el conductor comparte. */
export function PublicTrackingPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');

  const { data, error, loading, reload } = useAsync<PublicTracking | null>(
    (signal) =>
      code ? api<PublicTracking>(`/tracking/${code}`, { signal }) : Promise.resolve(null),
    [code],
  );

  const { updates, connected } = useLiveTracking(code);

  // Cada evento que llega por SSE dispara una recarga: el servidor es la fuente
  // de verdad de la línea de tiempo y así no se duplican entradas.
  useEffect(() => {
    if (updates.length > 0) {
      reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updates.length]);

  return (
    <div className="mx-auto min-h-dvh max-w-app bg-canvas px-5 py-8">
      <div className="flex justify-center">
        <Logo size={72} />
      </div>

      <form
        className="mt-8 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (draft.trim()) {
            navigate(`/seguimiento/${draft.trim().toUpperCase()}`);
          }
        }}
      >
        <label className="sr-only" htmlFor="code">
          Código de la cita
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
          <input
            id="code"
            className="field pl-11 font-mono uppercase tracking-wider"
            placeholder="AS-XXXXXX"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary shrink-0">
          Buscar
        </button>
      </form>

      {code && loading && <Spinner label="Consultando el estado…" />}
      {code && error && (
        <div className="mt-6">
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      {data && (
        <div className="mt-6 space-y-5">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold tracking-tight">{data.service.name}</h1>
              <p className="mt-0.5 text-sm text-ink-muted">
                {data.vehicle.brand} {data.vehicle.model} · {data.vehicle.plate}
              </p>
            </div>
            <StatusPill status={data.status} />
          </header>

          <div className="card space-y-1 p-4 text-sm">
            <p className="font-semibold">{data.workshop.name}</p>
            <p className="text-ink-muted">{data.workshop.address}</p>
            <p className="text-ink-muted">{formatDateTime(data.scheduledAt)}</p>
          </div>

          <section aria-labelledby="avance">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="avance" className="text-sm font-semibold">
                Avance del servicio
              </h2>
              {connected && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                  <Radio className="h-3.5 w-3.5" aria-hidden />
                  En vivo
                </span>
              )}
            </div>

            <div className="card p-4">
              <Timeline items={data.timeline} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
