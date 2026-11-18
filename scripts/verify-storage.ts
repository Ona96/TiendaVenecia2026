/**
 * Verificación E2E de la subida de fotos (Fase 8 — Storage).
 * Simula exactamente lo que hace el panel en el navegador:
 *   1. Login admin → upload con sesión (RLS: solo ADMIN escribe).
 *   2. URL pública legible sin sesión (storefront).
 *   3. Una CLIENTA no puede subir (política bloquea).
 *   4. Limpieza del objeto de prueba.
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

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** PNG 1x1 válido para la prueba. */
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

async function main() {
  const results: [string, boolean, string?][] = [];

  // 1. Sesión admin (la que usa el panel).
  const admin = createClient(URL_BASE, ANON);
  const adminLogin = await admin.auth.signInWithPassword({
    email: 'admin@venecia.com',
    password: 'VeneciaAdmin2026!',
  });
  results.push(['login admin', !adminLogin.error, adminLogin.error?.message]);

  const path = 'prueba-storage/foto-test.png';

  // 2. Subida con la sesión del admin (mismo canal que el navegador).
  const upload = await admin.storage
    .from('productos')
    .upload(path, PNG_1PX, { contentType: 'image/png', upsert: true });
  results.push(['admin sube foto al depósito', !upload.error, upload.error?.message]);

  // 3. URL pública SIN sesión (lo que hace el storefront).
  const publicUrl = `${URL_BASE}/storage/v1/object/public/productos/${path}`;
  const publicRes = await fetch(publicUrl);
  results.push(['URL pública legible sin sesión', publicRes.status === 200, `HTTP ${publicRes.status}`]);

  // 4. Una CLIENTA no puede subir (RLS).
  const clienta = createClient(URL_BASE, ANON);
  const clientaLogin = await clienta.auth.signInWithPassword({
    email: 'valentina@demo.venecia',
    password: 'VeneciaDemo2026!',
  });
  if (clientaLogin.error) {
    results.push(['login clienta demo', false, clientaLogin.error.message]);
  } else {
    const intento = await clienta.storage
      .from('productos')
      .upload('prueba-storage/hack.png', PNG_1PX, { contentType: 'image/png', upsert: true });
    results.push([
      'clienta NO puede subir (política)',
      Boolean(intento.error),
      intento.error ? 'bloqueada ✓' : '⚠️ SE COLÓ (revisar políticas)',
    ]);
  }

  // 5. Limpieza con service key (la admin podría borrar desde el panel).
  const service = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const removed = await service.storage.from('productos').remove([path]);
  results.push(['limpieza del objeto de prueba', !removed.error, removed.error?.message]);

  for (const [name, ok, detail] of results) {
    console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
  }
  const failed = results.filter(([, ok]) => !ok).length;
  console.log(`\n──────── ${results.length - failed}/${results.length} pruebas de storage OK ────────`);
  process.exit(failed > 0 ? 1 : 0);
}

void main();
