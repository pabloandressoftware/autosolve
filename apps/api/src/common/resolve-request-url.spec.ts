import { resolveRequestUrl } from './resolve-request-url';

describe('resolveRequestUrl', () => {
  it('reconstruye una ruta de un solo segmento', () => {
    expect(resolveRequestUrl('/api?__nestPath=health')).toBe('/api/health');
  });

  it('reconstruye una ruta anidada, que es la que rompía con el catch-all', () => {
    expect(resolveRequestUrl('/api?__nestPath=auth/login')).toBe('/api/auth/login');
    expect(resolveRequestUrl('/api?__nestPath=chat/sessions/abc/messages')).toBe(
      '/api/chat/sessions/abc/messages',
    );
  });

  it('conserva los parámetros reales de la petición', () => {
    expect(resolveRequestUrl('/api?__nestPath=services&q=chirrido')).toBe(
      '/api/services?q=chirrido',
    );
    expect(resolveRequestUrl('/api?q=chirrido&__nestPath=services&limit=3')).toBe(
      '/api/services?q=chirrido&limit=3',
    );
  });

  it('no filtra el parámetro interno hacia Nest', () => {
    expect(resolveRequestUrl('/api?__nestPath=services&q=frenos')).not.toContain('__nestPath');
  });

  it('tolera barras sobrantes en los extremos', () => {
    expect(resolveRequestUrl('/api?__nestPath=/health/')).toBe('/api/health');
  });

  it('deja pasar una URL que no viene del rewrite', () => {
    expect(resolveRequestUrl('/api/services?q=frenos')).toBe('/api/services?q=frenos');
    expect(resolveRequestUrl('/api/health')).toBe('/api/health');
  });
});
