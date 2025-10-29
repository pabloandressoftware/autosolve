import { ArrowLeft, Clock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { ServiceIcon } from '../components/ServiceIcon';
import { ErrorState, Spinner } from '../components/feedback';
import { api } from '../lib/api';
import { CATEGORY_LABEL, URGENCY_LABEL, URGENCY_TONE, formatCop, formatDuration } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import type { Service, Urgency } from '../types';

type ServiceDetail = Service & { symptoms: { label: string; urgency: Urgency }[] };

export function ServiceDetailPage() {
  const { slug = '' } = useParams();

  const { data, error, loading, reload } = useAsync<ServiceDetail>(
    (signal) => api<ServiceDetail>(`/services/${slug}`, { signal }),
    [slug],
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <div className="space-y-5">
      <Link to="/servicios" className="inline-flex items-center gap-1 text-sm text-ink-muted">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Servicios
      </Link>

      <header className="flex gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <ServiceIcon name={data.icon} className="h-6 w-6" />
        </span>

        <div>
          <h1 className="text-xl font-bold leading-tight tracking-tight">{data.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">{data.description}</p>
        </div>
      </header>

      <div className="card grid grid-cols-2 divide-x divide-hairline">
        <div className="p-4">
          <p className="text-xs uppercase tracking-wide text-ink-faint">Precio</p>
          <p className="mt-1 text-lg font-bold tracking-tight">{formatCop(data.priceCop)}</p>
        </div>
        <div className="p-4">
          <p className="text-xs uppercase tracking-wide text-ink-faint">Duración</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-lg font-bold tracking-tight">
            <Clock className="h-4 w-4 text-ink-faint" aria-hidden />
            {formatDuration(data.durationMin)}
          </p>
        </div>
      </div>

      <p className="chip">{CATEGORY_LABEL[data.category]}</p>

      {data.symptoms.length > 0 && (
        <section aria-labelledby="sintomas">
          <h2 id="sintomas" className="mb-2 text-sm font-semibold">
            Este servicio resuelve
          </h2>

          <ul className="card divide-y divide-hairline">
            {data.symptoms.map((symptom) => (
              <li key={symptom.label} className="flex items-center justify-between gap-3 p-4">
                <span className="text-sm">{symptom.label}</span>
                <span
                  className={`shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${URGENCY_TONE[symptom.urgency]}`}
                >
                  {URGENCY_LABEL[symptom.urgency]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link to={`/agendar?servicio=${data.slug}`} className="btn-primary w-full">
        Agendar este servicio
      </Link>
    </div>
  );
}
