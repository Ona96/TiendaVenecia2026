'use client';

/**
 * Fase 3a: puente de sesión real.
 *
 * La fuente de verdad es la sesión de Supabase (cookies httpOnly, leída
 * por proxy.ts en el servidor). Este hook sincroniza identidad y rol con
 * el store que ya consumen Header, perfil y el guardia de /admin, sin que
 * ningún componente decida roles por sí mismo.
 *
 * Reglas:
 * - El rol SIEMPRE se lee de la tabla `profiles` (RLS: solo tu propia fila).
 * - Sin Supabase configurado, el modo demo sigue funcionando igual.
 * - Nunca escribe contraseñas ni roles: solo refleja lo que dice el backend.
 */

import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/env';
import { useAuthStore } from '@/store/auth-store';
import type { Role, User } from '@/lib/types';

export function useSessionBridge(): void {
  const setSessionUser = useAuthStore((s) => s.setSessionUser);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    let alive = true;

    type BrowserClient = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

    async function sync(client: BrowserClient) {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session?.user) {
        // Sin sesión real: solo limpiamos si el store tenía un usuario del puente.
        const current = useAuthStore.getState().currentUser;
        if (current && current.id.startsWith('auth-')) {
          useAuthStore.getState().logout();
        }
        return;
      }

      // El rol vive en la base, no en el token (igual que proxy.ts).
      const { data: profile } = await client
        .from('profiles')
        .select('role, name')
        .eq('id', session.user.id)
        .single();

      if (!alive) return;

      const metaName =
        (session.user.user_metadata?.name as string | undefined) ??
        profile?.name ??
        session.user.email?.split('@')[0] ??
        'Clienta';

      const bridged: User = {
        id: `auth-${session.user.id}`,
        name: metaName,
        email: session.user.email ?? '',
        // Contraseña jamás viaja al cliente; el tipo lo exige por la demo previa.
        password: '',
        role: (profile?.role as Role | undefined) ?? 'CLIENTE',
      };

      setSessionUser(bridged);
    }

    void sync(supabase);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        useAuthStore.getState().logout();
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        void sync(supabase);
      }
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [setSessionUser]);
}
