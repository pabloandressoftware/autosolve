import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Logo } from '../components/Logo';
import { useAuth } from '../state/auth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-app flex-col justify-between bg-white px-6 py-10">
      <div className="flex flex-1 flex-col justify-center">
        <Logo />

        <p className="mt-6 text-center text-sm leading-relaxed text-ink-muted">
          Cita y asistencia para tu vehículo — rápido y seguro
        </p>

        <form className="mt-8 space-y-3" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="label" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="field"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="field"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Iniciar sesión'}
          </button>

          <Link to="/registro" className="btn-outline w-full">
            Crear cuenta
          </Link>
        </form>
      </div>

      <div className="space-y-4 text-center">
        <Link
          to="/servicios"
          className="text-sm font-medium text-ink-muted underline-offset-4 hover:underline"
        >
          Explorar sin cuenta
        </Link>

        <p className="text-[11px] leading-relaxed text-ink-faint">
          Al usar esta aplicación aceptas nuestros Términos de Servicio y la Política de Privacidad.
        </p>

        <p className="text-xs font-semibold tracking-widest text-ink-faint">COÉXITO · ENERGITÉCA</p>
      </div>
    </div>
  );
}
