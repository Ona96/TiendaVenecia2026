/**
 * Acceso centralizado a variables de entorno.
 * Nunca lanza en build: expone flags de configuración para que la app
 * degrade a modo demo de forma explícita (nunca fingida).
 */

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
  directUrl: process.env.DIRECT_URL ?? '',
  /** Mercado Pago (Fase 6): vacío = solo transferencia, nada simulado. */
  mpAccessToken: process.env.MP_ACCESS_TOKEN ?? '',
  mpWebhookSecret: process.env.MP_WEBHOOK_SECRET ?? '',
  /** Base pública para el webhook de MP (p. ej. https://midominio.com). */
  mpWebhookBaseUrl: process.env.MP_WEBHOOK_BASE_URL ?? '',
  /** Email transaccional (Fase 6): vacío = stub marcado, nunca "enviado" falso. */
  emailProviderUrl: process.env.EMAIL_PROVIDER_URL ?? '',
  emailProviderKey: process.env.EMAIL_PROVIDER_API_KEY ?? '',
  /**
   * Remitente visible por las clientas. Con Resend exige dominio verificado;
   * sin él solo se puede enviar desde onboarding@resend.dev a la casilla
   * propia del dueño de la cuenta (prueba, no producción).
   */
  emailFrom:
    process.env.EMAIL_FROM ?? 'Venecia Alta Costura <hola@venecia.com.ar>',
};

/** True solo si el proyecto Supabase tiene las claves públicas cargadas. */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

/** True si hay clave de servicio disponible (solo servidor). */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseServiceKey);
}

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase no está configurado. Completá NEXT_PUBLIC_SUPABASE_URL y ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local (ver docs/FASE-1.md).',
    );
  }
}
