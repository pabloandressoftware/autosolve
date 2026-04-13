import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-4xl font-bold tracking-tight text-brand-500">404</p>
      <p className="text-sm text-ink-muted">Esta pantalla no existe.</p>
      <Link to="/" className="btn-outline mt-2">
        Volver al inicio
      </Link>
    </div>
  );
}
