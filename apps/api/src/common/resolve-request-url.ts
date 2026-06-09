/**
 * Parámetro con el que el rewrite de Vercel nos pasa la ruta original.
 * Ver `vercel.json`: /api/(.*) → /api?__nestPath=$1
 */
export const NEST_PATH_PARAM = '__nestPath';

/**
 * Reconstruye la URL que NestJS debe ver a partir de la que entrega Vercel.
 *
 * Las funciones de Vercel no enrutan sub-rutas: `api/[...path].js` solo captura
 * un segmento, así que `/api/auth/login` devolvía 404. La solución es un
 * rewrite que manda todo a una única función y adjunta la ruta original en el
 * query string. Aquí se deshace esa transformación: se saca la ruta, se quita
 * el parámetro interno y se conservan intactos los parámetros de verdad.
 */
export function resolveRequestUrl(rawUrl: string): string {
  const separator = rawUrl.indexOf('?');

  if (separator === -1) {
    return rawUrl;
  }

  const params = new URLSearchParams(rawUrl.slice(separator + 1));
  const nestPath = params.get(NEST_PATH_PARAM);

  if (nestPath === null) {
    return rawUrl;
  }

  params.delete(NEST_PATH_PARAM);

  // El rewrite entrega la ruta sin el prefijo /api, que es el que Nest espera.
  const pathname = `/api/${nestPath.replace(/^\/+/, '')}`.replace(/\/+$/, '') || '/api';
  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}
