'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Clock, X } from 'lucide-react';
import type { Product } from '@/lib/types';
import { CATEGORY_LABEL, CUSTOM_SIZE } from '@/lib/constants';
import { useCartStore } from '@/store/cart-store';
import { formatCurrency, cn } from '@/lib/utils';

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const [selectedSize, setSelectedSize] = useState('');
  const [error, setError] = useState<string | null>(null);
  const soldOut = product.stock <= 0;

  function handleAdd() {
    if (!selectedSize) {
      setError('Elegí un talle para agregar el vestido.');
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      size: selectedSize,
      quantity: 1,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 grid max-h-[90vh] w-full max-w-4xl overflow-y-auto bg-ivory shadow-luxe md:grid-cols-2">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center bg-ivory/90 text-charcoal transition-colors hover:bg-gold"
          aria-label="Cerrar vista rápida"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative aspect-[3/4] md:aspect-auto">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="p-7 lg:p-9">
          <p className="eyebrow">{CATEGORY_LABEL[product.category]}</p>
          <h2 className="mt-2 font-display text-3xl text-charcoal">{product.name}</h2>
          <p className="mt-3 text-xl text-charcoal">{formatCurrency(product.price)}</p>

          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-stone-500">
            {product.description}
          </p>

          <p className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gold-dark">
            <Clock className="h-3.5 w-3.5" />
            {product.productionHours} horas de trabajo artesanal
          </p>

          <div className="mt-6">
            <p className="label">Talle</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  disabled={soldOut}
                  onClick={() => {
                    setSelectedSize(size);
                    setError(null);
                  }}
                  className={cn(
                    'min-w-[44px] border px-3 py-2 text-xs tracking-widest transition-colors',
                    'disabled:cursor-not-allowed disabled:opacity-30',
                    selectedSize === size
                      ? 'border-gold bg-gold text-charcoal'
                      : 'border-line bg-white text-charcoal hover:border-gold',
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
            <Link
              href={`/producto/${product.slug}`}
              className="mt-2 inline-block text-[11px] text-stone-500 underline-offset-4 transition-colors hover:text-gold-dark hover:underline"
            >
              ¿Necesitás otro talle? Confección a medida en la ficha completa
            </Link>
          </div>

          {error && (
            <p className="mt-4 border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <button
            onClick={handleAdd}
            disabled={soldOut}
            className={cn(
              'mt-6 flex w-full items-center justify-center gap-2 px-6 py-3.5 text-xs uppercase tracking-[0.22em] transition-colors',
              soldOut
                ? 'cursor-not-allowed bg-line text-stone-400'
                : 'bg-charcoal text-ivory hover:bg-charcoal-soft',
            )}
          >
            {soldOut ? 'Sin cupos de producción' : 'Agregar al carrito'}
          </button>

          <Link
            href={`/producto/${product.slug}`}
            className="mt-4 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] text-charcoal/60 transition-colors hover:text-gold-dark"
          >
            Ver ficha completa
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
