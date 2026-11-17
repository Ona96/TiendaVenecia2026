'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Imagen de producto con fallback elegante.
 *
 * Si la imagen no existe todavía (fotos del atelier pendientes), muestra
 * un panel tipográfico de la marca en vez de un ícono roto. Cuando el
 * archivo está, se renderiza normal y el fallback nunca aparece.
 */
export function ProductImage({
  src,
  alt,
  className,
  sizes = '(min-width: 1024px) 30vw, 50vw',
  fallbackLabel,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  fallbackLabel?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-[#efece5] via-[#e5e0d5] to-[#d9d3c4]',
          className,
        )}
      >
        <div className="flex flex-col items-center px-6 text-center">
          <span
            aria-hidden
            className="font-display text-3xl leading-none text-gold-dark/70"
          >
            {fallbackLabel?.trim()?.[0]?.toUpperCase() ?? 'V'}
          </span>
          {fallbackLabel && (
            <span className="mt-2 max-w-full truncate text-[10px] uppercase tracking-[0.2em] text-charcoal-muted/60">
              {fallbackLabel}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
