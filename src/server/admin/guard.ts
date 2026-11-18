import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/server/db';

/**
 * Guardia de autorización del servidor para /admin.
 *
 * La decisión de acceso SIEMPRE se toma aquí (y en proxy.ts), nunca en el
 * navegador. Triple verificación:
 *   1. Sesión de Supabase por cookies httpOnly (no falsificable).
 *   2. Rol leído de la tabla `profiles` en la base.
 *   3. Redirección si algo no cierra.
 *
 * Se usa en Server Components y al comienzo de cada Server Action del panel.
 */
export async function requireAdmin(): Promise<{ id: string; name: string }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/login?next=/admin');

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin');

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, role: true },
  });

  if (profile?.role !== 'ADMIN') redirect('/');
  return { id: profile.id, name: profile.name };
}

/**
 * Variante para Server Actions: en vez de redirigir, falla cerrado.
 * Una acción sin autorización NO debe ejecutar nada.
 */
export async function assertAdmin(): Promise<{ id: string; name: string }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase no configurado.');

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Sesión expirada. Volvé a iniciar sesión.');

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, role: true },
  });

  if (profile?.role !== 'ADMIN') throw new Error('No tenés permiso para esta operación.');
  return { id: profile.id, name: profile.name };
}
