import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { Spinner } from './components/feedback';
import { AppointmentDetailPage } from './pages/AppointmentDetailPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { BookingPage } from './pages/BookingPage';
import { ChatPage } from './pages/ChatPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { PublicTrackingPage } from './pages/PublicTrackingPage';
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

export function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/seguimiento" element={<PublicTrackingPage />} />
      <Route path="/seguimiento/:code" element={<PublicTrackingPage />} />

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
          path="citas"
          element={
            <RequireAuth>
              <AppointmentsPage />
            </RequireAuth>
          }
        />
        <Route
          path="citas/:id"
          element={
            <RequireAuth>
              <AppointmentDetailPage />
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
        <Route
          path="historial"
          element={
            <RequireAuth>
              <HistoryPage />
            </RequireAuth>
          }
        />
        <Route
          path="perfil"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
