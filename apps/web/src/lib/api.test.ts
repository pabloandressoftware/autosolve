import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, api, getToken, setToken } from './api';

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('api', () => {
  beforeEach(() => setToken(null));
  afterEach(() => vi.unstubAllGlobals());

  it('no envía cabecera de autorización sin sesión', async () => {
    const fetchMock = mockFetch(200, []);

    await api('/services');

    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('adjunta el token cuando hay sesión', async () => {
    setToken('abc123');
    const fetchMock = mockFetch(200, []);

    await api('/vehicles');

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer abc123');
  });

  it('serializa el cuerpo y marca el content-type solo cuando hay body', async () => {
    const fetchMock = mockFetch(201, {});

    await api('/vehicles', { method: 'POST', body: { plate: 'ABC123' } });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe('{"plate":"ABC123"}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('junta en un solo mensaje el arreglo de errores de validación de NestJS', async () => {
    mockFetch(400, { message: ['La placa es inválida', 'El año es obligatorio'] });

    await expect(api('/vehicles', { method: 'POST', body: {} })).rejects.toThrow(
      'La placa es inválida. El año es obligatorio',
    );
  });

  it('conserva el código de estado en el error', async () => {
    mockFetch(409, { message: 'Esa placa ya está registrada' });

    const error = await api('/vehicles').catch((cause: ApiError) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
  });

  it('da un mensaje genérico cuando el servidor falla sin cuerpo útil', async () => {
    mockFetch(500, null);

    await expect(api('/services')).rejects.toThrow(/No pudimos conectarnos/);
  });

  it('devuelve undefined en un 204 sin intentar leer JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 204, json: () => Promise.reject() });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api('/vehicles/1')).resolves.toBeUndefined();
  });
});

describe('almacenamiento del token', () => {
  it('sobrevive a un localStorage bloqueado sin lanzar', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });

    expect(() => getToken()).not.toThrow();
    expect(getToken()).toBeNull();
  });
});
