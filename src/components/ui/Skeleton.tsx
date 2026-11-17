import { cn } from '@/lib/utils';

/**
 * Esqueleto de carga con shimmer. Conservar las dimensiones del
 * contenido real evita saltos de layout (CLS).
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton', className)} />;
}

/** Esqueleto de tarjeta de producto (misma proporción que ProductCard). */
export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[3/4] w-full" />
      <Skeleton className="mt-4 h-3 w-2/3" />
      <Skeleton className="mt-2 h-3 w-1/3" />
      <Skeleton className="mt-3 h-3 w-1/4" />
    </div>
  );
}
