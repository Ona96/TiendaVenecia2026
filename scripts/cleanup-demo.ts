/**
 * Elimina las cuentas DEMO de Supabase (auth + profile) para dejar la base
 * lista para producción (decisión de la boutique: usar este mismo proyecto).
 *
 * Uso: npx tsx scripts/cleanup-demo.ts
 *
 * Borra SOLO estas cuentas conocidas de la demo:
 *   - admin@venecia.com      (admin de desarrollo)
 *   - valentina@demo.venecia (clienta de prueba)
 *
 * Guardas de seguridad (falla cerrado, no borra nada):
 *   1. Exige .env con SUPABASE_SERVICE_ROLE_KEY (uso local, como promote-admin).
 *   2. Exige que el correo real de la boutique ya sea ADMIN en profiles
 *      (evita cerrar la única puerta del panel).
 *   3. Reporta pedidos/presupuestos no-demo asociados antes de borrar:
 *      los perfiles se borran con FK SET NULL (los pedidos sobreviven
 *      huérfanos); direcciones y medidas caen en CASCADE.
 */
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
const SECRET = env.SUPABASE_SERVICE_ROLE_KEY!;

/** Cuentas demo a eliminar. */
const DEMO_EMAILS = ['admin@venecia.com', 'valentina@demo.venecia'];
/** Cuenta real de la boutique: debe ser ADMIN antes de borrar la demo. */
const OWNER_EMAIL = 'kvnrenott@gmail.com';

const serviceHeaders = {
  apikey: SECRET,
  Authorization: `Bearer ${SECRET}`,
  'Content-Type': 'application/json',
};

async function listUsers(): Promise<
  { id: string; email: string; email_confirmed_at: string | null }[]
> {
  const res = await fetch(
    `${URL_BASE}/auth/v1/admin/users?page=1&per_page=200`,
    { headers: serviceHeaders },
  );
  if (!res.ok) {
    console.error('❌ No pude listar usuarios del auth:', res.status, await res.text());
    process.exit(1);
  }
  const { users } = (await res.json()) as {
    users: { id: string; email: string; email_confirmed_at: string | null }[];
  };
  return users;
}

async function profileOf(id: string): Promise<{ role: string; name: string } | null> {
  const res = await fetch(`${URL_BASE}/rest/v1/profiles?id=eq.${id}&select=role,name`, {
    headers: serviceHeaders,
  });
  const rows = (await res.json()) as { role: string; name: string }[];
  return rows[0] ?? null;
}

async function relatedOrders(id: string) {
  const res = await fetch(
    `${URL_BASE}/rest/v1/orders?profileId=eq.${id}&select=id,code,status,isDemo`,
    { headers: serviceHeaders },
  );
  return (await res.json()) as {
    id: string;
    code: string;
    status: string;
    isDemo: boolean;
  }[];
}

async function relatedQuotes(id: string) {
  const res = await fetch(`${URL_BASE}/rest/v1/quotes?profileId=eq.${id}&select=id,code,isDemo`, {
    headers: serviceHeaders,
  });
  return (await res.json()) as { id: string; code: string; isDemo: boolean }[];
}

async function main() {
  if (!URL_BASE || !SECRET) {
    console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
    process.exit(1);
  }

  const users = await listUsers();

  // Guarda 2: la dueña ya debe ser ADMIN, si no abortamos sin tocar nada.
  const owner = users.find((u) => u.email.toLowerCase() === OWNER_EMAIL);
  if (!owner) {
    console.error(`❌ Guarda de seguridad: ${OWNER_EMAIL} todavía no está registrada.`);
    console.error('   Registrate en /login y confirmá el email; luego promové con:');
    console.error('   npx tsx scripts/promote-admin.ts ' + OWNER_EMAIL);
    process.exit(1);
  }
  const ownerProfile = await profileOf(owner.id);
  if (ownerProfile?.role !== 'ADMIN') {
    console.error(`❌ Guarda de seguridad: ${OWNER_EMAIL} existe pero NO es ADMIN (rol=${ownerProfile?.role}).`);
    console.error('   Ejecutá primero: npx tsx scripts/promote-admin.ts ' + OWNER_EMAIL);
    process.exit(1);
  }
  console.log(`✅ ${OWNER_EMAIL} es ADMIN: seguro continuar.`);

  // Guarda 3: reportar datos asociados antes de borrar.
  const targets = users.filter((u) => DEMO_EMAILS.includes(u.email.toLowerCase()));
  if (targets.length === 0) {
    console.log('No quedan cuentas demo en el auth. Nada que hacer. ✨');
    return;
  }

  for (const u of targets) {
    const profile = await profileOf(u.id);
    const orders = await relatedOrders(u.id);
    const quotes = await relatedQuotes(u.id);
    console.log(`\n→ Cuenta demo: ${u.email} (confirmada: ${u.email_confirmed_at ? 'sí' : 'no'})`);
    console.log(`  Perfil: rol=${profile?.role ?? '(sin perfil)'} nombre=${profile?.name ?? '-'}`);
    if (orders.length > 0) {
      console.log(`  Pedidos asociados (${orders.length}):`);
      orders.forEach((o) =>
        console.log(`    - ${o.code} · ${o.status}${o.isDemo ? ' · DEMO' : ' · NO-DEMO (sobrevive huérfano)'}`),
      );
    }
    if (quotes.length > 0) {
      console.log(`  Presupuestos asociados (${quotes.length}):`);
      quotes.forEach((q) =>
        console.log(`    - ${q.code}${q.isDemo ? ' · DEMO' : ' · NO-DEMO (sobrevive huérfano)'}`),
      );
    }

    // Borrar perfil primero: FKs dejan pedidos en SET NULL y borran
    // direcciones/medidas en CASCADE. Luego el usuario del auth.
    const delProfile = await fetch(`${URL_BASE}/rest/v1/profiles?id=eq.${u.id}`, {
      method: 'DELETE',
      headers: serviceHeaders,
    });
    if (!delProfile.ok) {
      console.error(`❌ Falló el borrado del perfil de ${u.email}:`, await delProfile.text());
      process.exit(1);
    }

    const delUser = await fetch(
      `${URL_BASE}/auth/v1/admin/users/${u.id}?should_soft_delete=false`,
      { method: 'DELETE', headers: serviceHeaders },
    );
    if (!delUser.ok) {
      console.error(`❌ Falló el borrado del usuario ${u.email}:`, delUser.status, await delUser.text());
      process.exit(1);
    }
    console.log(`  🗑️  Perfil y cuenta eliminados.`);
  }

  // Verificación final.
  const remaining = await listUsers();
  const stillDemo = remaining.filter((u) => DEMO_EMAILS.includes(u.email.toLowerCase()));
  console.log('\nCuentas restantes en el auth:');
  remaining.forEach((u) => console.log(`   - ${u.email}`));
  if (stillDemo.length === 0) {
    console.log('\n✅ Limpieza de cuentas demo completa.');
  } else {
    console.error('\n⚠️  Quedaron cuentas demo:', stillDemo.map((u) => u.email));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fallo inesperado:', err);
  process.exit(1);
});
