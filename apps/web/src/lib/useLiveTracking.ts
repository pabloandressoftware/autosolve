import { useEffect, useState } from 'react';

import type { AppointmentStatus } from '../types';

export interface LiveUpdate {
  appointmentId: string;
  code: string;
  status: AppointmentStatus;
  message: string;
  at: string;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

/**
 * Se suscribe al stream SSE del seguimiento. `EventSource` reintenta solo si se
 * cae la conexión, así que aquí únicamente se abre, se cierra y se reporta el
 * estado para poder mostrar el indicador «En vivo».
 */
export function useLiveTracking(code: string | undefined) {
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!code || typeof EventSource === 'undefined') {
      return;
    }

    const source = new EventSource(`${BASE_URL}/api/tracking/${code}/stream`);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (event) => {
      try {
        setUpdates((current) => [...current, JSON.parse(event.data) as LiveUpdate]);
      } catch {
        // Un mensaje malformado no debe tumbar la pantalla de seguimiento.
      }
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [code]);

  return { updates, connected };
}
