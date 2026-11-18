import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Setup de los tests de integración: carga .env ANTES de que los módulos
 * bajo prueba instancien Prisma. Corre solo contra la base de DEV
 * (Supabase del proyecto) y cada test limpia sus datos.
 */
const envRaw = readFileSync(fileURLToPath(new URL('../../.env', import.meta.url)), 'utf8');
for (const line of envRaw.split(/\r?\n/)) {
  if (!line.includes('=') || line.trim().startsWith('#')) continue;
  const i = line.indexOf('=');
  const key = line.slice(0, i).trim();
  if (!process.env[key]) process.env[key] = line.slice(i + 1).trim();
}

if (!process.env.DATABASE_URL) {
  throw new Error('Sin DATABASE_URL: los tests de integración necesitan la base de dev.');
}
