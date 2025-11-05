import { Check, MapPin, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ErrorState, Spinner } from '../components/feedback';
import { api } from '../lib/api';
import { formatCop, formatDuration } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import type { Appointment, Service, Vehicle, Workshop } from '../types';

interface BookingData {
  services: Service[];
  vehicles: Vehicle[];
  workshops: Workshop[];
}

/** Cupos que ofrece el taller, dentro del horario de atención (7:00–18:00). */
const SLOTS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

export function BookingPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const { data, error, loading, reload } = useAsync<BookingData>(
    async (signal) => ({
      services: await api<Service[]>('/services', { signal }),
      vehicles: await api<Vehicle[]>('/vehicles', { signal }),
      workshops: await api<Workshop[]>('/workshops', { signal }),
    }),
    [],
  );

  const [serviceSlug, setServiceSlug] = useState(params.get('servicio') ?? '');
  const [vehicleId, setVehicleId] = useState('');
  const [workshopId, setWorkshopId] = useState('');
  const [date, setDate] = useState(defaultDate());
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const service = useMemo(
    () => data?.services.find((item) => item.slug === serviceSlug) ?? null,
    [data, serviceSlug],
  );

  const ready = Boolean(service && vehicleId && workshopId && date && slot);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || !service) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const appointment = await api<Appointment>('/appointments', {
        method: 'POST',
        body: {
          serviceId: service.id,
          vehicleId,
          workshopId,
          // Se envía sin zona horaria para que el servidor la interprete en la
          // hora local del taller, que es la que el usuario está eligiendo.
          scheduledAt: `${date}T${slot}:00`,
          notes: notes.trim() || undefined,
        },
      });

      navigate(`/citas/${appointment.id}`, { replace: true });
    } catch (cause) {
      setSubmitError((cause as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  if (data.vehicles.length === 0) {
    return (
      <ErrorState message="Primero registra un vehículo en tu perfil para poder agendar." />
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <h1 className="text-xl font-bold tracking-tight">Agendar cita</h1>

      <div>
        <label className="label" htmlFor="service">
          Servicio
        </label>
        <select
          id="service"
          className="field"
          value={serviceSlug}
          onChange={(event) => setServiceSlug(event.target.value)}
          required
        >
          <option value="">Elige un servicio</option>
          {data.services.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name} — {formatCop(item.priceCop)}
            </option>
          ))}
        </select>

        {service && (
          <p className="mt-1.5 text-xs text-ink-faint">
            Toma {formatDuration(service.durationMin)}. El precio queda fijo al agendar.
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="vehicle">
          Vehículo
        </label>
        <select
          id="vehicle"
          className="field"
          value={vehicleId}
          onChange={(event) => setVehicleId(event.target.value)}
          required
        >
          <option value="">Elige tu vehículo</option>
          {data.vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.brand} {vehicle.model} · {vehicle.plate}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="label">Taller</legend>
        <ul className="space-y-2">
          {data.workshops.map((workshop) => (
            <li key={workshop.id}>
              <label
                className={`card flex cursor-pointer items-center gap-3 p-4 transition ${
                  workshopId === workshop.id ? 'border-brand-500 ring-2 ring-brand-100' : ''
                }`}
              >
                <input
                  type="radio"
                  name="workshop"
                  className="sr-only"
                  value={workshop.id}
                  checked={workshopId === workshop.id}
                  onChange={() => setWorkshopId(workshop.id)}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{workshop.name}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-muted">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {workshop.address}, {workshop.city}
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                  {workshop.rating.toFixed(1)}
                </span>

                {workshopId === workshop.id && (
                  <Check className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                )}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div>
        <label className="label" htmlFor="date">
          Fecha
        </label>
        <input
          id="date"
          type="date"
          className="field"
          min={defaultDate()}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          Atendemos de lunes a sábado, de 7:00 a. m. a 6:00 p. m.
        </p>
      </div>

      <fieldset>
        <legend className="label">Hora</legend>
        <ul className="grid grid-cols-4 gap-2">
          {SLOTS.map((time) => (
            <li key={time}>
              <label
                className={`flex cursor-pointer items-center justify-center rounded-xl border px-2 py-2.5 text-sm font-medium transition ${
                  slot === time
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-hairline bg-white text-ink-muted'
                }`}
              >
                <input
                  type="radio"
                  name="slot"
                  className="sr-only"
                  value={time}
                  checked={slot === time}
                  onChange={() => setSlot(time)}
                />
                {time}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div>
        <label className="label" htmlFor="notes">
          Notas <span className="font-normal normal-case text-ink-faint">(opcional)</span>
        </label>
        <textarea
          id="notes"
          className="field min-h-20 resize-y"
          placeholder="Ej. el ruido se escucha más en bajadas"
          maxLength={300}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      {submitError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {submitError}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={!ready || submitting}>
        {submitting ? 'Agendando…' : service ? `Confirmar · ${formatCop(service.priceCop)}` : 'Confirmar'}
      </button>
    </form>
  );
}

/** Mañana en formato YYYY-MM-DD: la anticipación mínima es de una hora. */
function defaultDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}
