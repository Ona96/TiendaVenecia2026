'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useCatalogStore, selectPublishedProducts } from '@/store/catalog-store';
import { CATEGORY_LABEL } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { useMounted } from '@/lib/hooks';

export function FeaturedCollection() {
  const mounted = useMounted();
  const products = useCatalogStore((s) => s.products);

  const featured = useMemo(() => {
    const published = selectPublishedProducts(products);
    const preferred = published.filter((p) => p.featured);
    return (preferred.length >= 4 ? preferred : published).slice(0, 4);
  }, [products]);

  if (!mounted) {
    return <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4" />;
  }

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
              <Image
                src={dress.images[0]}
                alt={dress.name}
                fill
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
