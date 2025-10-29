import { CalendarPlus, Car, MessageCircle, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ServiceCard } from '../components/ServiceCard';
import { ErrorState, Spinner } from '../components/feedback';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { useAuth } from '../state/auth';
import type { Service } from '../types';

const QUICK_ACTIONS = [
  { to: '/agendar', label: 'Agendar cita', icon: CalendarPlus },
  { to: '/chat', label: 'Chat con asesor', icon: MessageCircle },
  { to: '/perfil', label: 'Mis vehículos', icon: Car },
];

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data, error, loading, reload } = useAsync<Service[]>(
    (signal) => api<Service[]>('/services/recommended', { signal }),
    [],
  );

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/servicios?q=${encodeURIComponent(term)}` : '/servicios');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          Hola{user ? `, ${user.fullName.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-0.5 text-sm text-ink-muted">¿Qué necesita tu carro hoy?</p>
      </div>

      <form onSubmit={handleSearch} role="search">
        <label className="sr-only" htmlFor="search">
          Buscar servicio
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
          <input
            id="search"
            type="search"
            className="field pl-11"
            placeholder="¿Qué servicio necesitas? (ej. cambio de aceite)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </form>

      <section aria-labelledby="acciones">
        <h2 id="acciones" className="mb-3 text-sm font-semibold">
          Acciones rápidas
        </h2>

        <ul className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="card flex h-full flex-col items-center gap-2 px-2 py-4 text-center transition hover:border-brand-200"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-[11px] font-medium leading-tight text-ink-muted">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recomendados">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recomendados" className="text-sm font-semibold">
            Servicios recomendados
          </h2>
          <Link to="/servicios" className="text-xs font-semibold text-brand-600">
            Ver todos
          </Link>
        </div>

        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={reload} />}

        <ul className="space-y-3">
          {data?.map((service) => (
            <li key={service.id}>
              <ServiceCard service={service} compact />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
