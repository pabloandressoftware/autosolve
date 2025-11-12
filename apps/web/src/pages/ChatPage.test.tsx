import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderApp } from '../test/render';
import { ChatPage } from './ChatPage';

const SESSION = {
  id: 's1',
  messages: [{ id: 'm0', role: 'BOT', content: 'Hola, soy AutoSolve.', createdAt: '' }],
  suggestions: [{ slug: 'chirrido-al-frenar', label: 'Chirrido o vibración al frenar' }],
};

const RECOMMENDATION = {
  reply: { id: 'm2', role: 'BOT', content: 'Te recomiendo Revisión de Frenos.', createdAt: '' },
  suggestions: [],
  recommendation: {
    service: {
      id: 'srv',
      slug: 'revision-de-frenos',
      name: 'Revisión de Frenos',
      description: 'Inspección completa.',
      priceCop: 120000,
      durationMin: 60,
      category: 'SEGURIDAD_VIAL',
      icon: 'brake',
    },
    symptom: 'Chirrido o vibración al frenar',
    urgency: 'ALTA',
    matched: ['chirrido'],
  },
};

function queueFetch(responses: { status: number; body: unknown }[]) {
  const fetchMock = vi.fn();
  responses.forEach((response) =>
    fetchMock.mockResolvedValueOnce({
      ok: response.status < 400,
      status: response.status,
      json: () => Promise.resolve(response.body),
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('ChatPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('abre la conversación con el saludo y los chips de síntomas', async () => {
    queueFetch([{ status: 201, body: SESSION }]);

    renderApp(<ChatPage />);

    expect(await screen.findByText('Hola, soy AutoSolve.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Chirrido o vibración al frenar' }),
    ).toBeInTheDocument();
  });

  it('muestra la recomendación con precio, urgencia y botón de agendar', async () => {
    queueFetch([
      { status: 201, body: SESSION },
      { status: 201, body: RECOMMENDATION },
    ]);

    renderApp(<ChatPage />);
    await screen.findByText('Hola, soy AutoSolve.');

    await userEvent.type(screen.getByLabelText('Escribe tu mensaje'), 'chirrido al frenar');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(await screen.findByText('Revisión de Frenos')).toBeInTheDocument();
    expect(screen.getByText('$120.000 · 1 h')).toBeInTheDocument();
    expect(screen.getByText('Urgente')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Agendar Revisión de Frenos' }),
    ).toHaveAttribute('href', '/agendar?servicio=revision-de-frenos');
  });

  it('revierte el mensaje si el envío falla y lo devuelve al campo de texto', async () => {
    queueFetch([
      { status: 201, body: SESSION },
      { status: 500, body: { message: 'Se cayó el servidor' } },
    ]);

    renderApp(<ChatPage />);
    await screen.findByText('Hola, soy AutoSolve.');

    const input = screen.getByLabelText('Escribe tu mensaje');
    await userEvent.type(input, 'algo raro suena');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Se cayó el servidor');
    await waitFor(() => expect(screen.queryByText('algo raro suena')).not.toBeInTheDocument());
    expect(input).toHaveValue('algo raro suena');
  });
});
