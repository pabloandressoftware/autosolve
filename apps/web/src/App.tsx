import { Navigate, Route, Routes } from 'react-router-dom';

import { Spinner } from './components/feedback';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';
import { useAuth } from './state/auth';

function Placeholder() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/entrar" replace />;

  return (
    <div className="mx-auto max-w-app px-5 py-10">
      <p className="text-sm text-ink-muted">
        Sesión iniciada como <span className="font-semibold text-ink">{user.fullName}</span>.
      </p>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route index element={<Placeholder />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
