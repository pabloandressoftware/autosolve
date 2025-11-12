import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider } from '../state/auth';

/** Renderiza con router y sesión, que es lo que casi toda pantalla necesita. */
export function renderApp(ui: ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter
      initialEntries={[route]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}
