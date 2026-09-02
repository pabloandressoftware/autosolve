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
 * Envuelve al layout completo, no a cada pantalla: así el visitante sin sesión
 * nunca llega a ver un fotograma del encabezado y el menú antes de que la
 * redirección ocurra.
 *
 * Mientras se revalida el token guardado se muestra un spinner en vez de
 * redirigir, para no expulsar al usuario en cada recarga.
 */
function PrivateLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  return user ? <AppShell /> : <Navigate to="/entrar" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/seguimiento" element={<PublicTrackingPage />} />
      <Route path="/seguimiento/:code" element={<PublicTrackingPage />} />

      {/*
        La raíz exige sesión, así que quien llega por primera vez ve la
        pantalla de bienvenida — igual que en el prototipo, donde la primera
        pantalla es la de marca con «Explorar sin cuenta».
      */}
      <Route element={<PrivateLayout />}>
        <Route index element={<HomePage />} />
        <Route path="agendar" element={<BookingPage />} />
        <Route path="citas" element={<AppointmentsPage />} />
        <Route path="citas/:id" element={<AppointmentDetailPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="historial" element={<HistoryPage />} />
        <Route path="perfil" element={<ProfilePage />} />
      </Route>

      {/* Pantallas que el prototipo permite ver «sin cuenta». */}
      <Route element={<AppShell />}>
        <Route path="servicios" element={<ServicesPage />} />
        <Route path="servicios/:slug" element={<ServiceDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
