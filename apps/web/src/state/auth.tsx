import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { api, getToken, setToken } from '../lib/api';
import type { Session, User } from '../types';

interface AuthContextValue {
  user: User | null;
  /** `true` mientras se revalida el token guardado al abrir la app. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Al abrir la app revalidamos el token: pudo expirar o el usuario pudo ser
  // eliminado mientras la sesión estaba guardada en el teléfono.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    api<User>('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const start = useCallback((session: Session) => {
    setToken(session.accessToken);
    setUser(session.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      start(await api<Session>('/auth/login', { method: 'POST', body: { email, password } }));
    },
    [start],
  );

  const register = useCallback(
    async (input: { email: string; password: string; fullName: string; phone?: string }) => {
      start(await api<Session>('/auth/register', { method: 'POST', body: input }));
    },
    [start],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }

  return context;
}
