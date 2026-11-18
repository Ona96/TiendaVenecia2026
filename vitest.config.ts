import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Los tests de integración se agrupan y corren con npm run test:db:
    // marcan las rutas con @db y acá se excluyen del rápido de unidad.
    exclude: ['tests/integration/**'],
  },
});
