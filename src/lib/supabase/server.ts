import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env, isSupabaseConfigured } from '@/lib/env';

/**
 * Cliente Supabase del lado servidor con sesión por cookies httpOnly.
 * Solo usar en Server Components, Server Actions y Route Handlers.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamado desde un Server Component: la sesión se refresca en proxy.ts.
        }
      },
    },
  });
}

/**
 * Cliente con clave de servicio (bypass de RLS).
 * SOLO para operaciones de servidor de confianza (webhooks, seed, verificación
 * de pagos). Jamás importar desde componentes de cliente.
 */
export function createSupabaseAdminClient() {
  if (!isSupabaseConfigured() || !env.supabaseServiceKey) return null;
  return createServerClient(env.supabaseUrl, env.supabaseServiceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // Cliente sin sesión de usuario.
      },
    },
  });
}
