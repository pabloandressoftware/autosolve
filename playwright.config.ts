import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      // Se prueba en viewport de teléfono porque es el contexto real de uso:
      // alguien de pie junto a su carro averiado.
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
