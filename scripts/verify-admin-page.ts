/**
 * Verificación server-side de una página de admin con sesión real (Node).
 * Hace lo mismo que hacía el andamio de Fase 5: login con supabase-js,
 * cookie en formato @supabase/ssr y GET con esa cookie.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const envRaw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const env = Object.fromEntries(
  envRaw
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

async function main() {
  const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL!;
  const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const anon = createClient(URL_BASE, ANON);
  const { data, error } = await anon.auth.signInWithPassword({
    email: 'admin@venecia.com',
    password: 'VeneciaAdmin2026!',
  });
  if (error || !data.session) {
    console.error('❌ login falló:', error?.message);
    process.exit(1);
  }

  const raw = JSON.stringify(data.session);
  const value = `base64-${Buffer.from(raw, 'utf8').toString('base64url')}`;
  const cookie = `sb-csiddxjhnmzynqfzjnkj-auth-token=${value}`;

  const target = process.argv[2] ?? 'http://localhost:3000/admin/telas';
  const res = await fetch(target, { headers: { cookie } });
  const html = await res.text();

  console.log(`HTTP ${res.status} · ${res.url}`);
  // Nota: las páginas de /admin hidratan en el cliente (guardia de layout
  // client-side), por lo que el HTML es el shell; el payload RSC debe
  // traer los datos del servidor. Verificamos marcadores del payload.
  const checks: [string, boolean][] = [
    ['Shell del panel (no login)', !html.includes('Bienvenida de nuevo')],
    ['Telas en el payload del servidor', html.includes('enUso')],
    ['Seda mikado cargada', html.includes('Seda mikado')],
    ['Brocado cargado', html.includes('Brocado')],
  ];
  for (const [label, ok] of checks) {
    console.log(`${ok ? '✅' : '❌'} ${label}`);
  }
  const failed = checks.filter(([, ok]) => !ok).length;
  process.exit(failed > 0 ? 1 : 0);
}

void main();
