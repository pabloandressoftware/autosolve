import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../state/auth';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      navigate('/', { replace: true });
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-app bg-white px-6 py-8">
      <Link to="/entrar" className="inline-flex items-center gap-1 text-sm text-ink-muted">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver
      </Link>

      <h1 className="mt-6 text-2xl font-bold tracking-tight">Crear cuenta</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Con tu cuenta puedes agendar, seguir el servicio y guardar el historial de tu carro.
      </p>

      <form className="mt-6 space-y-3" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="label" htmlFor="fullName">
            Nombre completo
          </label>
          <input
            id="fullName"
            required
            className="field"
            autoComplete="name"
            value={form.fullName}
            onChange={update('fullName')}
          />
        </div>

        <div>
          <label className="label" htmlFor="email">
            Correo
          </label>
          <input
            id="email"
            type="email"
            required
            className="field"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
          />
        </div>

        <div>
          <label className="label" htmlFor="phone">
            Celular <span className="font-normal normal-case text-ink-faint">(opcional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            className="field"
            autoComplete="tel"
            placeholder="+57 300 000 0000"
            value={form.phone}
            onChange={update('phone')}
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            className="field"
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
          />
          <p className="mt-1.5 text-xs text-ink-faint">Mínimo 8 caracteres, con letras y números.</p>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  );
}
