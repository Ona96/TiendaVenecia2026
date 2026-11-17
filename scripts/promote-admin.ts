/**
 * Promueve una cuenta a ADMIN (uso: npx tsx scripts/promote-admin.ts <email>).
 *
 * Single-operator: solo lo ejecuta la boutique desde su máquina local con
 * la clave de servicio en .env. El guard trigger permite el cambio porque
 * la escritura del backend no lleva JWT de clienta.
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
const email = (process.argv[2] ?? '').trim().toLowerCase();

if (!email.includes('@')) {
  console.error('Uso: npx tsx scripts/promote-admin.ts <email>');
  process.exit(1);
}

const serviceHeaders = {
  apikey: SECRET,
  Authorization: `Bearer ${SECRET}`,
  'Content-Type': 'application/json',
};

async function main() {
  // 1. Buscar la cuenta en auth.users.
  const listRes = await fetch(
    `${URL_BASE}/auth/v1/admin/users?page=1&per_page=200`,
    { headers: serviceHeaders },
  );
  const { users } = (await listRes.json()) as {
    users: { id: string; email: string; email_confirmed_at: string | null }[];
  };
  const user = users.find((u) => u.email.toLowerCase() === email);

  if (!user) {
    console.error(`❌ No existe la cuenta ${email} en el auth. ¿Te registraste con otro email?`);
    console.error('   Cuentas registradas:');
    users.forEach((u) => console.error(`   - ${u.email}`));
    process.exit(1);
  }

  console.log(`Cuenta: ${user.email}`);
  console.log(
    user.email_confirmed_at
      ? 'Email confirmado: ✅'
      : 'Email confirmado: ❌ (falta clicar el enlace del mensaje de Supabase)',
  );

  // 2. Verificar que el trigger creó el perfil.
  const profRes = await fetch(
    `${URL_BASE}/rest/v1/profiles?id=eq.${user.id}&select=id,role,name`,
    { headers: serviceHeaders },
  );
  const profiles = (await profRes.json()) as { role: string; name: string }[];
  if (profiles.length === 0) {
    console.error('❌ El perfil no existe (el trigger no corrió). Corriendo rescate…');
    const create = await fetch(`${URL_BASE}/rest/v1/profiles`, {
      method: 'POST',
      headers: serviceHeaders,
      body: JSON.stringify({ id: user.id, role: 'CLIENTE', name: email.split('@')[0] }),
    });
    if (!create.ok) {
      console.error('❌ No se pudo crear el perfil manualmente:', await create.text());
      process.exit(1);
    }
  } else {
    console.log(`Perfil actual: rol=${profiles[0].role} nombre=${profiles[0].name}`);
  }

  // 3. Promover (idempotente).
  const patch = await fetch(`${URL_BASE}/rest/v1/profiles?id=eq.${user.id}`, {
    method: 'PATCH',
    headers: serviceHeaders,
    body: JSON.stringify({ role: 'ADMIN' }),
  });
  if (!patch.ok) {
    console.error('❌ Falló la promoción:', await patch.text());
    process.exit(1);
  }

  // 4. Verificar.
  const after = (await (
    await fetch(`${URL_BASE}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
      headers: serviceHeaders,
    })
  ).json()) as { role: string }[];

  if (after[0]?.role === 'ADMIN') {
    console.log(`✅ ${email} es ADMIN. Cerrá sesión y volvé a iniciar para que el rol llegue a la sesión.`);
  } else {
    console.error('❌ La verificación no muestra ADMIN. Revisar a mano.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fallo inesperado:', err);
  process.exit(1);
});
