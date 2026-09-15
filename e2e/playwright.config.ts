import { defineConfig } from '@playwright/test';

// URL_BASE permite apuntar las mismas pruebas al entorno local o al publicado en producción,
// tal como exige el examen (misma prueba o equivalente para local y para producción).
const URL_BASE = process.env.URL_BASE || 'http://localhost:4000';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: URL_BASE,
    headless: process.env.CI ? true : false,
    screenshot: 'only-on-failure',
  },
});
