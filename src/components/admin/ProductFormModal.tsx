'use client';

import { useState, useTransition } from 'react';
import { ImagePlus, Loader2, Upload, X } from 'lucide-react';
import type { AdminProductView } from '@/server/admin/products';
import { saveProduct, type ProductInput } from '@/server/admin/actions';
import { uploadProductImage } from '@/lib/storage';
import { slugify } from '@/lib/utils';
import { CATEGORY_SLUGS, OCCASIONS, STANDARD_SIZES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { fromCents } from '@/lib/money';

interface ProductFormModalProps {
  /** Prenda a editar, o null para crear una nueva. */
  product: AdminProductView | null;
  /** Telas activas desde la base (gestión en /admin/telas). */
  fabrics: { id: string; nombre: string; descripcion: string | null }[];
  onClose: () => void;
}

function defaultImages(name: string): string[] {
  return [`/images/products/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'venecia-nueva'}-1.jpg`];
}

/**
 * Formulario de prendas sobre datos REALES (Fase 3).
 * Guarda con una server action: la validación y el dinero en centavos
 * se resuelven en el servidor, este formulario solo arma el payload.
 */
export function ProductFormModal({ product, fabrics, onClose }: ProductFormModalProps) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  const [draft, setDraft] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    priceArs: product ? Math.round(fromCents(product.priceCents)) : 0,
    categorySlug: product?.categorySlug ?? 'fiesta',
    fabrics: product?.fabrics ?? ([] as string[]),
    occasions: product?.occasions ?? ([] as string[]),
    sizes: product?.sizes ?? ([] as string[]),
    stock: product?.stock ?? 3,
    productionHours: product?.productionHours ?? 60,
    images: product && product.images.length > 0 ? product.images : defaultImages('nuevo-vestido'),
    featured: product?.featured ?? false,
    status: product?.status === 'PAUSADO' ? ('PAUSADO' as const) : ('PUBLICADO' as const),
  });

  function updateField<K extends keyof typeof draft>(field: K, value: (typeof draft)[K]) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function toggleIn(field: 'fabrics' | 'occasions' | 'sizes', value: string) {
    setDraft((prev) => {
      const list = prev[field];
      return {
        ...prev,
        [field]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  }

  function updateImage(index: number, value: string) {
    setDraft((prev) => {
      const images = [...prev.images];
      images[index] = value;
      return { ...prev, images };
    });
  }

  async function handleUpload(index: number, file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploadingSlot(index);
    try {
      // Sube a Supabase Storage con la sesión de la admin; la URL
      // pública queda lista para guardar con la prenda.
      const result = await uploadProductImage(file, slugify(draft.name));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      updateImage(index, result.url);
    } finally {
      setUploadingSlot(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload: ProductInput = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      priceArs: Math.round(draft.priceArs),
      categorySlug: draft.categorySlug,
      fabrics: draft.fabrics,
      occasions: draft.occasions,
      sizes: draft.sizes,
      stock: Math.max(0, Math.round(draft.stock)),
      productionHours: Math.max(1, Math.round(draft.productionHours)),
      images: draft.images.map((i) => i.trim()).filter(Boolean),
      featured: draft.featured,
      status: draft.status,
    };

    start(async () => {
      const result = await saveProduct(payload, product?.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-ivory shadow-luxe"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-ivory px-7 py-5">
          <div>
            <p className="eyebrow">{product ? 'Editar prenda' : 'Nueva prenda'}</p>
            <p className="mt-1 font-display text-2xl text-charcoal">
              {product ? product.name : 'Vestido sin nombre'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center text-charcoal transition-colors hover:bg-gold/10 hover:text-gold-dark"
            aria-label="Cerrar formulario"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-7 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="p-name">Nombre</label>
              <input
                id="p-name"
                className="field"
                value={draft.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Vestido Venice"
              />
            </div>
            <div>
              <label className="label" htmlFor="p-price">Precio (ARS)</label>
              <input
                id="p-price"
                type="number"
                min={0}
                step={1000}
                className="field"
                value={draft.priceArs || ''}
                onChange={(e) => updateField('priceArs', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label" htmlFor="p-category">Categoría</label>
              <select
                id="p-category"
                className="field"
                value={draft.categorySlug}
                onChange={(e) => updateField('categorySlug', e.target.value)}
              >
                {CATEGORY_SLUGS.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="p-stock">Stock / cupos de producción</label>
              <input
                id="p-stock"
                type="number"
                min={0}
                className="field"
                value={draft.stock}
                onChange={(e) => updateField('stock', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label" htmlFor="p-hours">Horas de trabajo artesanal</label>
              <input
                id="p-hours"
                type="number"
                min={1}
                className="field"
                value={draft.productionHours}
                onChange={(e) => updateField('productionHours', Number(e.target.value))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="p-description">Descripción</label>
              <textarea
                id="p-description"
                rows={3}
                className="field resize-none"
                value={draft.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Escote, caída, bordados, detalles de la confección…"
              />
            </div>
          </div>

          <div>
            <p className="label">Telas</p>
            {fabrics.length === 0 ? (
              <p className="text-[11px] text-stone-400">
                No hay telas activas: cargalas en «Telas» del panel.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {fabrics.map((fabric) => (
                  <button
                    key={fabric.id}
                    type="button"
                    title={fabric.descripcion ?? undefined}
                    onClick={() => toggleIn('fabrics', fabric.nombre)}
                    className={cn(
                      'border px-3 py-1.5 text-xs transition-colors',
                      draft.fabrics.includes(fabric.nombre)
                        ? 'border-gold bg-gold text-charcoal'
                        : 'border-line bg-white hover:border-gold',
                    )}
                  >
                    {fabric.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="label">Ocasiones</p>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((occasion) => (
                <button
                  key={occasion}
                  type="button"
                  onClick={() => toggleIn('occasions', occasion)}
                  className={cn(
                    'border px-3 py-1.5 text-xs transition-colors',
                    draft.occasions.includes(occasion)
                      ? 'border-gold bg-gold text-charcoal'
                      : 'border-line bg-white hover:border-gold',
                  )}
                >
                  {occasion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Talles estándar (además de a medida)</p>
            <div className="flex flex-wrap gap-2">
              {STANDARD_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleIn('sizes', size)}
                  className={cn(
                    'min-w-[46px] border px-3 py-1.5 text-xs tracking-widest transition-colors',
                    draft.sizes.includes(size)
                      ? 'border-gold bg-gold text-charcoal'
                      : 'border-line bg-white hover:border-gold',
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="flex items-center gap-2 label">
              <ImagePlus className="h-3.5 w-3.5" />
              Fotos de la prenda
            </p>
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    className="field"
                    value={draft.images[index] ?? ''}
                    onChange={(e) => updateImage(index, e.target.value)}
                    placeholder={
                      index === 0
                        ? 'Foto principal (subila o pegá la ruta)'
                        : `Vista ${index + 1} (opcional)`
                    }
                    aria-label={`Ruta o URL de la foto ${index + 1}`}
                  />
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-1.5 whitespace-nowrap border px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] transition-colors',
                      uploadingSlot === index
                        ? 'border-gold bg-gold/10 text-gold-dark'
                        : 'border-charcoal/25 text-charcoal hover:border-gold hover:text-gold-dark',
                    )}
                  >
                    {uploadingSlot === index ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Subiendo…
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        Subir
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={uploadingSlot !== null}
                      onChange={(e) => void handleUpload(index, e.target.files?.[0])}
                    />
                  </label>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-stone-400">
              «Subir» guarda la foto en el depósito del atelier y completa la ruta sola. También
              podés pegar una URL externa a mano.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 border border-line bg-white p-5">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => updateField('featured', e.target.checked)}
                className="h-3.5 w-3.5 accent-[#C5A059]"
              />
              Destacar en la home
            </label>
            <div>
              <label className="label mb-1" htmlFor="p-status">Estado</label>
              <select
                id="p-status"
                className="field py-2"
                value={draft.status}
                onChange={(e) => updateField('status', e.target.value as 'PUBLICADO' | 'PAUSADO')}
              >
                <option value="PUBLICADO">Publicado</option>
                <option value="PAUSADO">Pausado</option>
              </select>
            </div>
          </div>

          {error && (
            <p role="alert" className="border border-error-soft bg-error-soft px-4 py-2.5 text-xs text-error">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-line bg-ivory px-7 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-charcoal/30 px-6 py-3 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 bg-charcoal px-6 py-3 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft disabled:opacity-40"
          >
            {pending && (
              <span
                aria-hidden
                className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent"
              />
            )}
            {product ? 'Guardar cambios' : 'Crear prenda'}
          </button>
        </div>
      </form>
    </div>
  );
}
