import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderApp } from '../test/render';
import { LoginPage } from './LoginPage';

function mockFetch(response: { status: number; body: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.status < 400,
    status: response.status,
    json: () => Promise.resolve(response.body),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('LoginPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('muestra la marca y las dos acciones del wireframe', () => {
    mockFetch({ status: 200, body: {} });
    renderApp(<LoginPage />);

    expect(screen.getByText('AutoSolve')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar sin cuenta' })).toBeInTheDocument();
  });

  it('envía las credenciales a la API', async () => {
    const fetchMock = mockFetch({
      status: 200,
      body: { accessToken: 'token', user: { id: '1', email: 'a@b.co', fullName: 'A', phone: null } },
    });

    renderApp(<LoginPage />);
    await userEvent.type(screen.getByLabelText('Correo'), 'camila@autosolve.co');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Segura123');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(url).toContain('/api/auth/login');
    expect(JSON.parse(init.body)).toEqual({
      email: 'camila@autosolve.co',
      password: 'Segura123',
    });
  });

  it('muestra el mensaje de la API cuando las credenciales fallan', async () => {
    mockFetch({ status: 401, body: { message: 'Correo o contraseña incorrectos' } });

    renderApp(<LoginPage />);
    await userEvent.type(screen.getByLabelText('Correo'), 'camila@autosolve.co');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
  });
});
