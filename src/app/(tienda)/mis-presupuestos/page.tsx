import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { getMyQuotes } from '@/server/admin/quotes';
import { MisPresupuestosClient } from '@/components/store/MisPresupuestosClient';

/**
 * Mis presupuestos (Fase 5): solicitudes y propuestas del taller,
 * con aceptación web auditada. Solo lo propio (sesión httpOnly).
 */
export default async function MisPresupuestosPage() {
  const quotes = await getMyQuotes();

  // Sin sesión: getMyQuotes devuelve vacío; distinguimos invitada real.
  const { createSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-5 py-28 text-center">
        <LogIn className="mx-auto h-8 w-8 text-gold/60" />
        <h1 className="mt-5 font-display text-3xl text-charcoal">Ingresá para ver tus presupuestos</h1>
        <p className="mt-3 text-sm text-stone-500">
          Si lo pediste sin cuenta, te llega la propuesta por email igual.
        </p>
        <Link
          href="/login?next=/mis-presupuestos"
          className="mt-8 inline-block bg-charcoal px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return <MisPresupuestosClient quotes={quotes} />;
}
