import Link from 'next/link';

/** 404 con la identidad del atelier (antes: página default de Next). */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-charcoal px-6 text-center">
      <p className="font-display text-5xl tracking-[0.28em] text-ivory">VENECIA</p>
      <p className="mt-2 text-[10px] uppercase tracking-luxe text-gold">Alta Costura</p>
      <p className="mt-10 font-display text-3xl text-ivory">Esta puntada no existe</p>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ivory/60">
        La página que buscás cambió de lugar o nunca se confeccionó. Volvé a la boutique y seguí
        explorando la colección.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block bg-gold px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-light"
      >
        Volver a la boutique
      </Link>
    </main>
  );
}
