'use client';

import { useSessionBridge } from '@/lib/auth/session-bridge';

/**
 * Cliente puente de sesión (Fase 3a). Se monta una vez en el layout raíz
 * y sincroniza la sesión real de Supabase con el store de la app.
 */
export function SessionBridge() {
  useSessionBridge();
  return null;
}
