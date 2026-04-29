import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { Spinner } from './components/feedback';
import { BookingPage } from './pages/BookingPage';
import { ChatPage } from './pages/ChatPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { ServicesPage } from './pages/ServicesPage';
import { useAuth } from './state/auth';

/**
 * Rutas que requieren sesión. Mientras se revalida el token guardado se muestra
 * un spinner en vez de redirigir, para no expulsar al usuario en cada recarga.
 */
function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/entrar" replace />;
}

function Pendiente({ nombre }: { nombre: string }) {
  return (
    <div className="card p-8 text-center text-sm text-ink-muted">
      {nombre} — en construcción.
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="servicios" element={<ServicesPage />} />
        <Route path="servicios/:slug" element={<ServiceDetailPage />} />

        <Route
          path="agendar"
          element={
            <RequireAuth>
              <BookingPage />
            </RequireAuth>
          }
        />
        <Route
          path="chat"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />

        {['citas', 'historial', 'perfil'].map((path) => (
          <Route
            key={path}
            path={path}
            element={
              <RequireAuth>
                <Pendiente nombre={path} />
              </RequireAuth>
            }
          />
        ))}

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
