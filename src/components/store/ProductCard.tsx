'use client';

import Link from 'next/link';
import { Eye } from 'lucide-react';
import type { Product } from '@/lib/types';
import { CATEGORY_LABEL } from '@/lib/constants';
import { formatCurrency, cn } from '@/lib/utils';
import { ProductImage } from '@/components/ui/ProductImage';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 3;

  return (
    <div className="group">
      <div className="relative overflow-hidden bg-line">
        <Link href={`/producto/${product.slug}`} aria-label={product.name}>
          <div className="relative aspect-[3/4]">
            <ProductImage
              src={product.images[0]}
              alt={product.name}
              fallbackLabel={product.name}
              className={cn(
                'object-cover transition-all duration-700 group-hover:scale-105',
                soldOut && 'opacity-50 grayscale',
              )}
            />
          </div>
        </Link>

        {!soldOut && (
          <button
            onClick={() => onQuickView(product)}
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 bg-ivory/95 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] text-charcoal opacity-0 shadow-luxe transition-all duration-300 hover:bg-gold hover:text-charcoal group-hover:opacity-100"
          >
            <Eye className="h-3.5 w-3.5" />
            Vista rápida
          </button>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {soldOut ? (
            <span className="bg-charcoal px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-ivory">
              Agotado
            </span>
          ) : lowStock ? (
            <span className="bg-gold px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-charcoal">
              Últimos cupos
            </span>
          ) : null}
          {product.status === 'PUBLICADO' && product.featured && (
            <span className="bg-ivory/90 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-gold-dark">
              Destacado
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="eyebrow">{CATEGORY_LABEL[product.category]}</p>
        <Link
          href={`/producto/${product.slug}`}
          className="mt-1.5 inline-block font-display text-lg text-charcoal transition-colors hover:text-gold-dark"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-sm text-stone-500">{formatCurrency(product.price)}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-stone-400">
          {product.sizes.join(' · ')} + a medida
        </p>
      </div>
    </div>
  );
}
