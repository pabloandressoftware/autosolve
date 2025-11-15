import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ServiceCard } from '../components/ServiceCard';
import { EmptyState, ErrorState, Spinner } from '../components/feedback';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import type { Service } from '../types';

export function ServicesPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const [draft, setDraft] = useState(query);

  // Mantiene el input sincronizado si se llega con ?q= desde el inicio.
  useEffect(() => setDraft(query), [query]);

  const { data, error, loading, reload } = useAsync<Service[]>(
    (signal) =>
      api<Service[]>(`/services${query ? `?q=${encodeURIComponent(query)}` : ''}`, { signal }),
    [query],
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const term = draft.trim();
    setParams(term ? { q: term } : {}, { replace: true });
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold tracking-tight">Servicios</h1>

      <form onSubmit={handleSubmit} role="search">
        <label className="sr-only" htmlFor="services-search">
          Buscar servicio
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
          <input
            id="services-search"
            type="search"
            className="field pl-11"
            placeholder="Busca por servicio o por la falla que sientes"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
      </form>

      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && data.length === 0 && (
        <EmptyState
          title="No encontramos ese servicio"
          description="Prueba con otras palabras, o cuéntale al chat qué le pasa a tu carro y te decimos qué necesita."
        />
      )}

      <ul className="space-y-3">
        {data?.map((service) => (
          <li key={service.id}>
            <ServiceCard service={service} />
          </li>
        ))}
      </ul>
    </div>
  );
}
