'use client';

import { ProductImage } from '@/components/ui/ProductImage';
import { useState } from 'react';
import { Pencil, Play, Plus, Pause, Trash2 } from 'lucide-react';
import { useCatalogStore } from '@/store/catalog-store';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import { CATEGORY_LABEL } from '@/lib/constants';
import { formatCurrency, cn } from '@/lib/utils';
import { useMounted } from '@/lib/hooks';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/lib/types';

export default function AdminPrendasPage() {
  const mounted = useMounted();
  const products = useCatalogStore((s) => s.products);
  const toggleProductStatus = useCatalogStore((s) => s.toggleProductStatus);
  const deleteProduct = useCatalogStore((s) => s.deleteProduct);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  if (!mounted) {
    return (
      <div className="p-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const sorted = [...products].sort(
    (a, b) => Number(b.status === 'PUBLICADO') - Number(a.status === 'PUBLICADO'),
  );

  function openCreate() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (pendingDelete) {
      deleteProduct(pendingDelete.id);
      setPendingDelete(null);
    }
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
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-gold px-6 py-3 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-light"
        >
          <Plus className="h-4 w-4" />
          Nueva prenda
        </button>
      </div>

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
                src={product.images[0]}
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
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">{CATEGORY_LABEL[product.category]}</p>
                  <p className="mt-1 font-display text-lg text-charcoal">{product.name}</p>
                </div>
                <p className="text-sm text-charcoal">{formatCurrency(product.price)}</p>
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
                  onClick={() => openEdit(product)}
                  className="flex flex-1 items-center justify-center gap-1.5 border border-charcoal/25 px-3 py-2.5 text-[10px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => toggleProductStatus(product.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 border border-charcoal/25 px-3 py-2.5 text-[10px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark"
                >
                  {product.status === 'PUBLICADO' ? (
                    <>
                      <Pause className="h-3.5 w-3.5" />
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
                  onClick={() => setPendingDelete(product)}
                  className="flex items-center justify-center border border-charcoal/25 px-3 py-2.5 text-charcoal transition-colors hover:border-red-400 hover:text-red-600"
                  aria-label={`Eliminar ${product.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {formOpen && (
        <ProductFormModal
          key={editingProduct?.id ?? 'nueva'}
          product={editingProduct}
          onClose={() => setFormOpen(false)}
        />
      )}

      {/* Confirmación de borrado */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
            onClick={() => setPendingDelete(null)}
          />
          <div className="relative z-10 w-full max-w-md border border-line bg-ivory p-8 text-center shadow-luxe">
            <p className="eyebrow">Eliminar prenda</p>
            <p className="mt-3 font-display text-2xl text-charcoal">{pendingDelete.name}</p>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              Se quita del catálogo y deja de estar disponible para el storefront. Esta acción no
              afecta los pedidos ya registrados.
            </p>
            <div className="mt-7 flex justify-center gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="border border-charcoal/30 px-6 py-3 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark"
              >
                Conservar
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 px-6 py-3 text-xs uppercase tracking-[0.22em] text-white transition-colors hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
