import { LogOut, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ErrorState, Spinner } from '../components/feedback';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { useAuth } from '../state/auth';
import type { Vehicle } from '../types';

const EMPTY = { plate: '', brand: '', model: '', year: '', mileageKm: '' };

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data, error, loading, reload } = useAsync<Vehicle[]>(
    (signal) => api<Vehicle[]>('/vehicles', { signal }),
    [],
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update(field: keyof typeof EMPTY) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function addVehicle(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      await api('/vehicles', {
        method: 'POST',
        body: {
          plate: form.plate,
          brand: form.brand,
          model: form.model,
          year: Number(form.year),
          mileageKm: form.mileageKm ? Number(form.mileageKm) : 0,
        },
      });

      setForm(EMPTY);
      setShowForm(false);
      reload();
    } catch (cause) {
      setFormError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removeVehicle(id: string) {
    await api(`/vehicles/${id}`, { method: 'DELETE' });
    reload();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight">{user?.fullName}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{user?.email}</p>
        {user?.phone && <p className="text-sm text-ink-muted">{user.phone}</p>}
      </header>

      <section aria-labelledby="vehiculos">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="vehiculos" className="text-sm font-semibold">
            Mis vehículos
          </h2>

          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600"
            onClick={() => setShowForm((current) => !current)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Agregar
          </button>
        </div>

        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={reload} />}

        {data && data.length > 0 && (
          <ul className="card divide-y divide-hairline">
            {data.map((vehicle) => (
              <li key={vehicle.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {vehicle.brand} {vehicle.model} <span className="text-ink-faint">{vehicle.year}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-xs tracking-wider text-ink-muted">
                    {vehicle.plate} · {vehicle.mileageKm.toLocaleString('es-CO')} km
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-full p-2 text-ink-faint transition hover:bg-red-50 hover:text-red-600"
                  onClick={() => removeVehicle(vehicle.id)}
                  aria-label={`Eliminar ${vehicle.brand} ${vehicle.model}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        {showForm && (
          <form className="card mt-3 space-y-3 p-4" onSubmit={addVehicle}>
            <div>
              <label className="label" htmlFor="plate">
                Placa
              </label>
              <input
                id="plate"
                className="field uppercase"
                placeholder="ABC123"
                required
                value={form.plate}
                onChange={update('plate')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="brand">
                  Marca
                </label>
                <input id="brand" className="field" required value={form.brand} onChange={update('brand')} />
              </div>
              <div>
                <label className="label" htmlFor="model">
                  Modelo
                </label>
                <input id="model" className="field" required value={form.model} onChange={update('model')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="year">
                  Año
                </label>
                <input
                  id="year"
                  type="number"
                  className="field"
                  required
                  value={form.year}
                  onChange={update('year')}
                />
              </div>
              <div>
                <label className="label" htmlFor="mileageKm">
                  Kilometraje
                </label>
                <input
                  id="mileageKm"
                  type="number"
                  className="field"
                  value={form.mileageKm}
                  onChange={update('mileageKm')}
                />
              </div>
            </div>

            {formError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {formError}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar vehículo'}
            </button>
          </form>
        )}
      </section>

      <button
        type="button"
        className="btn-ghost w-full"
        onClick={() => {
          logout();
          navigate('/entrar', { replace: true });
        }}
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Cerrar sesión
      </button>
    </div>
  );
}
