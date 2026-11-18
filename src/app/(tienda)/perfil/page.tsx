import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { getMyProfile } from '@/server/store/profile';
import { PerfilClient } from '@/components/store/PerfilClient';

/**
 * Perfil (Fase 5): datos y medidas REALES de la sesión.
 * Sin sesión → invitación a entrar (mis-pedidos usa la misma lógica).
 */
export default async function PerfilPage() {
  const profile = await getMyProfile();

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl px-5 py-28 text-center">
        <LogIn className="mx-auto h-8 w-8 text-gold/60" />
        <h1 className="mt-5 font-display text-3xl text-charcoal">Ingresá a tu cuenta</h1>
        <p className="mt-3 text-sm text-stone-500">
          Tus datos y medidas guardadas viven en tu cuenta del atelier.
        </p>
        <Link
          href="/login?next=/perfil"
          className="mt-8 inline-block bg-charcoal px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return <PerfilClient profile={profile} />;
}
