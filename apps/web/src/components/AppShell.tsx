import { Bell, CalendarDays, Clock, Home, MessageCircle, User } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../state/auth';

const TABS = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/citas', label: 'Citas', icon: CalendarDays, end: false },
  { to: '/chat', label: 'Chat', icon: MessageCircle, end: false },
  { to: '/historial', label: 'Historial', icon: Clock, end: false },
  { to: '/perfil', label: 'Perfil', icon: User, end: false },
];

/**
 * Contenedor de la app: encabezado de marca, contenido y menú inferior de cinco
 * pestañas, igual que el wireframe. El ancho se limita a 28rem para que en
 * escritorio se vea como el teléfono que se probó con los usuarios.
 */
export function AppShell() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-dvh max-w-app flex-col bg-canvas">
      <header className="sticky top-0 z-10 border-b border-hairline bg-white/85 backdrop-blur">
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm font-semibold tracking-tight">
            Energitéca <span className="text-ink-faint">/</span> Coéxito
          </p>

          <div className="flex items-center gap-1">
            <NavLink
              to="/citas"
              className="rounded-full p-2 text-ink-muted hover:bg-canvas"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" aria-hidden />
            </NavLink>

            <button
              type="button"
              onClick={() => navigate('/perfil')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
              aria-label="Ir a mi perfil"
            >
              {initials(user?.fullName)}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28 pt-5">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-app border-t border-hairline bg-white/95 backdrop-blur"
        aria-label="Navegación principal"
      >
        <ul className="flex items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                    isActive ? 'text-brand-600' : 'text-ink-faint hover:text-ink-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.8} aria-hidden />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function initials(fullName?: string): string {
  if (!fullName) {
    return '?';
  }

  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
