const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const TOKEN_KEY = 'autosolve.token';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // Modo privado o almacenamiento bloqueado: la sesión dura lo que la pestaña.
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignorado a propósito: no vale la pena romper la app por esto.
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Cliente HTTP mínimo. Adjunta el token si existe y traduce el cuerpo de error
 * de NestJS (donde `message` puede ser string o string[]) a un solo mensaje.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/api${path}`, {
    method: options.method ?? 'GET',
    signal: options.signal,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, extractMessage(payload, response.status));
  }

  return payload as T;
}

function extractMessage(payload: unknown, status: number): string {
  const message = (payload as { message?: unknown } | null)?.message;

  if (Array.isArray(message)) {
    return message.join('. ');
  }

  if (typeof message === 'string') {
    return message;
  }

  return status >= 500
    ? 'No pudimos conectarnos con el servidor. Intenta de nuevo.'
    : 'Algo salió mal con la solicitud.';
}
