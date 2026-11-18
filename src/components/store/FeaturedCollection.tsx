'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CATEGORY_LABEL } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { ProductImage } from '@/components/ui/ProductImage';
import type { Product } from '@/lib/types';

/** Destacadas de la home: datos reales pasados por el Server Component. */
export function FeaturedCollection({ products }: { products: Product[] }) {
  const featured = (products.filter((p) => p.featured).length >= 4
    ? products.filter((p) => p.featured)
    : products
  ).slice(0, 4);

  return (
    <>
      <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {featured.map((dress) => (
          <Link
            key={dress.id}
            href={`/producto/${dress.slug}`}
            className="group"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-line">
              <ProductImage
                src={dress.images[0]}
                alt={dress.name}
                fallbackLabel={dress.name}
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="mt-4 text-center">
              <p className="eyebrow">{CATEGORY_LABEL[dress.category]}</p>
              <p className="mt-1.5 font-display text-lg text-charcoal transition-colors group-hover:text-gold-dark">
                {dress.name}
              </p>
              <p className="mt-1 text-sm text-stone-500">{formatCurrency(dress.price)}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-12 text-center">
        <Link
          href="/coleccion"
          className="inline-flex items-center gap-2 bg-charcoal px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
        >
          Ver colección completa
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}
