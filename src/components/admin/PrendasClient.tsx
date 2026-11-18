'use client';

import { useState, useTransition } from 'react';
import { Pencil, Play, Plus, Archive } from 'lucide-react';
import type { AdminProductView } from '@/server/admin/products';
import type { FabricView } from '@/server/admin/fabrics';
import { setProductStatus, archiveProduct } from '@/server/admin/actions';
import { ProductImage } from '@/components/ui/ProductImage';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import { formatCents } from '@/lib/money';
import { cn } from '@/lib/utils';

/**
 * Listado de prendas con acciones server-side (Fase 3).
 * La autorización la hace cada action en el servidor; este componente
 * solo muestra y dispara.
 */
export function PrendasClient({
  products,
  fabrics,
}: {
  products: AdminProductView[];
  fabrics: Pick<FabricView, 'id' | 'nombre' | 'descripcion'>[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProductView | null>(null);
  const [pendingArchive, setPendingArchive] = useState<AdminProductView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const sorted = [...products].sort(
    (a, b) => Number(b.status === 'PUBLICADO') - Number(a.status === 'PUBLICADO'),
  );

  function toggleStatus(product: AdminProductView) {
    setError(null);
    const next = product.status === 'PUBLICADO' ? 'PAUSADO' : 'PUBLICADO';
    start(async () => {
      const result = await setProductStatus(product.id, next);
      if (!result.ok) setError(result.error);
    });
  }

  function confirmArchive() {
    if (!pendingArchive) return;
    const target = pendingArchive;
    setPendingArchive(null);
    setError(null);
    start(async () => {
      const result = await archiveProduct(target.id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Gestión</p>
          <h1 className="mt-2 font-display text-3xl text-charcoal">Prendas del catálogo</h1>
          <p className="mt-2 text-sm text-stone-500">
            {products.length} prendas · {products.filter((p) => p.status === 'PUBLICADO').length}{' '}
            publicadas
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          disabled={pending}
          className="inline-flex items-center gap-2 bg-gold px-6 py-3 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-light disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Nueva prenda
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 border border-error-soft bg-error-soft px-4 py-2.5 text-xs text-error">
          {error}
        </p>
      )}

      {sorted.length === 0 ? (
        <div className="mt-10 border border-line bg-white px-8 py-20 text-center">
          <p className="font-display text-2xl text-charcoal">El catálogo está vacío</p>
          <p className="mt-2 text-sm text-stone-500">
            Cargá tu primera prenda con el botón «Nueva prenda».
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((product) => (
            <article
              key={product.id}
              className={cn(
                'flex flex-col border border-line bg-white transition-opacity',
                product.status === 'PAUSADO' && 'opacity-70',
              )}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-line">
                <ProductImage
                  src={product.images[0] ?? ''}
                  alt={product.name}
                  fallbackLabel={product.name}
                  sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
                <span
                  className={cn(
                    'absolute left-3 top-3 px-3 py-1 text-[10px] uppercase tracking-[0.14em]',
                    product.status === 'PUBLICADO'
                      ? 'bg-ivory/90 text-gold-dark'
                      : 'bg-charcoal text-ivory',
                  )}
                >
                  {product.status === 'PUBLICADO' ? 'Publicada' : 'Pausada'}
                </span>
                {product.isDemo && (
                  <span className="absolute right-3 top-3 bg-gold/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-charcoal">
                    Demo
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">{product.categoryName}</p>
                    <p className="mt-1 font-display text-lg text-charcoal">{product.name}</p>
                  </div>
                  <p className="text-sm text-charcoal">{formatCents(product.priceCents)}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em] text-stone-500">
                  <span className="border border-line px-2 py-1">{product.stock} cupos</span>
                  <span className="border border-line px-2 py-1">{product.productionHours} h</span>
                  <span className="border border-line px-2 py-1">
                    {product.fabrics[0] ?? 'Sin tela'}
                  </span>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <button
                    onClick={() => {
                      setEditing(product);
                      setFormOpen(true);
                    }}
                    disabled={pending}
                    className="flex flex-1 items-center justify-center gap-1.5 border border-charcoal/25 px-3 py-2.5 text-[10px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => toggleStatus(product)}
                    disabled={pending}
                    className="flex flex-1 items-center justify-center gap-1.5 border border-charcoal/25 px-3 py-2.5 text-[10px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
                  >
                    {product.status === 'PUBLICADO' ? (
                      <>
                        <Play className="h-3.5 w-3.5 rotate-90" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        Publicar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setPendingArchive(product)}
                    disabled={pending}
                    aria-label={`Archivar ${product.name}`}
                    className="flex items-center justify-center border border-charcoal/25 px-3 py-2.5 text-charcoal transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen && (
        <ProductFormModal
          key={editing?.id ?? 'nueva'}
          product={editing}
          fabrics={fabrics}
          onClose={() => setFormOpen(false)}
        />
      )}

      {/* Confirmación de archivo (nunca borrado físico) */}
      {pendingArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
            onClick={() => setPendingArchive(null)}
          />
          <div className="relative z-10 w-full max-w-md border border-line bg-ivory p-8 text-center shadow-luxe">
            <p className="eyebrow">Archivar prenda</p>
            <p className="mt-3 font-display text-2xl text-charcoal">{pendingArchive.name}</p>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              Sale del catálogo y del storefront, pero <strong>no se borra</strong>: si tiene
              pedidos o reseñas en su historial, todo queda intacto para contabilidad y garantía.
            </p>
            <div className="mt-7 flex justify-center gap-3">
              <button
                onClick={() => setPendingArchive(null)}
                className="border border-charcoal/30 px-6 py-3 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark"
              >
                Conservar
              </button>
              <button
                onClick={confirmArchive}
                disabled={pending}
                className="bg-charcoal px-6 py-3 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft disabled:opacity-40"
              >
                Archivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
