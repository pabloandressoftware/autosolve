import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

// jsdom no implementa estas dos APIs del navegador y las usamos para el
// autoscroll del chat y para el stream de seguimiento.
Element.prototype.scrollIntoView = vi.fn();

if (typeof globalThis.EventSource === 'undefined') {
  globalThis.EventSource = class {
    close = vi.fn();
    onopen: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
  } as unknown as typeof EventSource;
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
