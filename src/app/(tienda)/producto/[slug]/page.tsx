import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getPublishedProductBySlug } from '@/server/store/catalog';
import { ProductDetailClient } from '@/components/store/ProductDetailClient';

/**
 * Ficha de producto (Fase 4): Server Component que resuelve la prenda
 * por slug desde la base. PAUSADO/ARCHIVADO → 404 (no existe para la tienda).
 */
export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-5 py-32 text-center">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-3 font-display text-3xl text-charcoal">Vestido no encontrado</h1>
        <p className="mt-3 text-sm text-stone-500">
          La prenda que buscás ya no está en el catálogo o cambió de nombre.
        </p>
        <Link
          href="/coleccion"
          className="mt-8 inline-flex items-center gap-2 bg-charcoal px-6 py-3 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la colección
        </Link>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
}
