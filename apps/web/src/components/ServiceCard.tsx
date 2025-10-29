import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CATEGORY_LABEL, formatCop, formatDuration } from '../lib/format';
import type { Service } from '../types';
import { ServiceIcon } from './ServiceIcon';

interface ServiceCardProps {
  service: Service;
  /** La versión compacta se usa en «Servicios recomendados» del inicio. */
  compact?: boolean;
}

export function ServiceCard({ service, compact = false }: ServiceCardProps) {
  return (
    <article className="card p-4">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <ServiceIcon name={service.icon} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold leading-snug">{service.name}</h3>
            <p className="shrink-0 text-sm font-bold tracking-tight">
              {formatCop(service.priceCop)}
            </p>
          </div>

          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{service.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {formatDuration(service.durationMin)}
            </span>

            {!compact && <span className="chip">{CATEGORY_LABEL[service.category]}</span>}

            <Link
              to={`/servicios/${service.slug}`}
              className="ml-auto rounded-full bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600"
            >
              Ver
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
