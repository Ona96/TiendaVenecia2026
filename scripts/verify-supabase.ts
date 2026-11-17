/**
 * Verificación de extremo a extremo de la activación Supabase (Fase 1b).
 *
 * Ejecutar: npx tsx scripts/verify-supabase.ts
 *
 * Prueba con llamadas REALES (REST + Auth), sin mocks:
 *  1. Crea admin + clienta demo vía API admin (service key).
 *  2. Verifica que el trigger handle_new_user auto-crea el perfil.
 *  3. Promueve la admin (service role bypasea RLS; la guardia de rol
 *     permite escrituras sin JWT).
 *  4. Sign-in real de la clienta con JWT de Supabase.
 *  5. RLS: anon no lee perfiles, no puede crear pedidos; la clienta
 *     solo ve lo suyo; el rol no es auto-editable.
 */
import { readFileSync } from 'node:fs';

// Carga mínima de .env (tsx no lo carga solo).
const envRaw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const envVars = Object.fromEntries(
  envRaw
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const URL_BASE = envVars.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SECRET = envVars.SUPABASE_SERVICE_ROLE_KEY!;

if (!URL_BASE || !SECRET) {
  console.error('Faltan credenciales en .env');
  process.exit(1);
}

const results: { name: string; ok: boolean; detail: string }[] = [];
function record(name: string, ok: boolean, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const serviceHeaders = {
  apikey: SECRET,
  Authorization: `Bearer ${SECRET}`,
  'Content-Type': 'application/json',
};

async function rest(
  path: string,
  init: RequestInit & { headers?: Record<string, string> } = {},
): Promise<Response> {
  return fetch(`${URL_BASE}${path}`, init);
}

async function main() {
  // ---------- 1. Usuarios demo (API admin) ----------
  const users: { email: string; password: string; name: string; role: 'ADMIN' | 'CLIENTE' }[] = [
    { email: 'admin@venecia.com', password: 'VeneciaAdmin2026!', name: 'Administradora Venecia', role: 'ADMIN' },
    { email: 'valentina@demo.venecia', password: 'VeneciaDemo2026!', name: 'Valentina López', role: 'CLIENTE' },
  ];

  for (const u of users) {
    const res = await rest('/auth/v1/admin/users', {
      method: 'POST',
      headers: serviceHeaders,
      body: JSON.stringify({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name },
      }),
    });
    if (res.ok || res.status === 422) {
      record(`auth: crear ${u.email}`, true, res.ok ? 'creado' : 'ya existía (idempotente)');
    } else {
      record(`auth: crear ${u.email}`, false, `${res.status} ${await res.text()}`);
    }
  }

  // ---------- 2. Trigger: perfil auto-creado ----------
  let profileRows: { id: string; role: string; name: string }[] = [];
  {
    const res = await rest('/rest/v1/profiles?select=id,role,name', {
      headers: serviceHeaders,
    });
    profileRows = await res.json();
  }

  // Los emails viven en auth.users (el perfil se une 1:1 por id).
  const authList = (await (
    await rest('/auth/v1/admin/users?page=1&per_page=50', { headers: serviceHeaders })
  ).json()) as { users: { id: string; email: string }[] };

  for (const u of users) {
    const authUser = authList.users?.find((a) => a.email === u.email);
    const row = profileRows.find((p) => p.id === authUser?.id);
    record(
      `trigger: perfil auto-creado para ${u.email}`,
      Boolean(row),
      row ? `rol=${row.role} nombre=${row.name}` : 'NO EXISTE — el trigger no corrió',
    );
  }

  // ---------- 3. Promover a admin ----------
  const adminAuth = authList.users?.find((a) => a.email === users[0].email);
  const adminProfile = profileRows.find((p) => p.id === adminAuth?.id);
  if (adminProfile) {
    const res = await rest(`/rest/v1/profiles?id=eq.${adminProfile.id}`, {
      method: 'PATCH',
      headers: serviceHeaders,
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    record('promoción: admin@venecia.com → rol ADMIN', res.ok, res.ok ? '' : await res.text());
  }

  // ---------- 4. Sign-in real de la clienta ----------
  const tokenRes = await rest('/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: PUBLISHABLE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: users[1].email, password: users[1].password }),
  });
  const session = (await tokenRes.json()) as { access_token?: string };
  const clientaJwt = session.access_token;
  record('auth: sign-in valentina@demo.venecia (JWT real)', Boolean(clientaJwt));

  const clientaHeaders = {
    apikey: PUBLISHABLE,
    Authorization: `Bearer ${clientaJwt}`,
  };
  const anonHeaders = { apikey: PUBLISHABLE };

  // ---------- 5. Verificaciones RLS ----------
  // Catálogo público: anon ve los productos del seed.
  {
    const res = await rest('/rest/v1/products?select=id,slug,isDemo', { headers: anonHeaders });
    const products = (await res.json()) as { id: string; isDemo: boolean }[];
    record(
      'RLS: anon LEE el catálogo público',
      res.ok && products.length >= 8,
      `${products.length} productos (todos isDemo=${products.every((p) => p.isDemo)})`,
    );
  }

  // Perfiles: anon NO ve nada.
  {
    const res = await rest('/rest/v1/profiles?select=id', { headers: anonHeaders });
    const rows = await res.json();
    record('RLS: anon NO lee perfiles de otras', res.ok && Array.isArray(rows) && rows.length === 0, `${(rows as unknown[]).length} filas`);
  }

  // Pedidos: anon NO puede crear (los totales los calcula el servidor).
  {
    const res = await rest('/rest/v1/orders', {
      method: 'POST',
      headers: { ...anonHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'atacante@ejemplo.com', totalCents: 1, shippingMethod: 'RETIRA' }),
    });
    record('RLS: anon NO crea pedidos (server-side only)', res.status >= 400, `HTTP ${res.status}`);
  }

  // Clienta: ve solo SU perfil.
  {
    const res = await rest('/rest/v1/profiles?select=id', { headers: clientaHeaders });
    const rows = (await res.json()) as { id: string }[];
    const meAuth = authList.users?.find((a) => a.email === users[1].email);
    record(
      'RLS: clienta ve solo su propio perfil',
      res.ok && Array.isArray(rows) && rows.length === 1 && rows[0].id === meAuth?.id,
      `${Array.isArray(rows) ? rows.length : 'respuesta no válida'} fila(s)`,
    );
  }

  // Clienta: pedidos vacíos (aún no compró).
  {
    const res = await rest('/rest/v1/orders?select=id', { headers: clientaHeaders });
    const rows = await res.json();
    record('RLS: clienta ve sus pedidos → [] (vacío)', res.ok && Array.isArray(rows) && (rows as unknown[]).length === 0);
  }

  // Clienta: NO puede auto-promoverse a ADMIN (guardia anti-escalada).
  {
    const meAuth = authList.users?.find((a) => a.email === users[1].email);
    const me = profileRows.find((p) => p.id === meAuth?.id);
    const res = await rest(`/rest/v1/profiles?id=eq.${me!.id}`, {
      method: 'PATCH',
      headers: { ...clientaHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    record('Guardia: clienta NO puede auto-promoverse a ADMIN', res.status >= 400, `HTTP ${res.status}`);
  }

  // ---------- Resumen ----------
  const failed = results.filter((r) => !r.ok);
  console.log(`\n──────── RESULTADO: ${results.length - failed.length}/${results.length} pruebas OK ────────`);
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fallo inesperado:', err);
  process.exit(1);
});
