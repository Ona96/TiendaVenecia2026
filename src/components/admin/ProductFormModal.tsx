'use client';

import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useCatalogStore, type ProductDraft } from '@/store/catalog-store';
import {
  CATEGORIES,
  FABRICS,
  OCCASIONS,
  STANDARD_SIZES,
} from '@/lib/constants';
import { slugify, cn } from '@/lib/utils';
import type { DressCategory, Product } from '@/lib/types';

interface ProductFormModalProps {
  /** Prenda a editar, o null para crear una nueva. */
  product: Product | null;
  onClose: () => void;
}

const EMPTY_FABRICS: string[] = [];
const EMPTY_OCCASIONS: string[] = [];
const EMPTY_SIZES: string[] = [];

function defaultImages(name: string): string[] {
  const base = slugify(name) || 'venecia-nueva';
  return [
    `https://picsum.photos/seed/venecia-${base}-1/900/1200`,
    `https://picsum.photos/seed/venecia-${base}-2/900/1200`,
    `https://picsum.photos/seed/venecia-${base}-3/900/1200`,
  ];
}

export function ProductFormModal({ product, onClose }: ProductFormModalProps) {
  const addProduct = useCatalogStore((s) => s.addProduct);
  const updateProduct = useCatalogStore((s) => s.updateProduct);

  const [draft, setDraft] = useState<ProductDraft>(() =>
    product
      ? {
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          fabrics: product.fabrics,
          occasions: product.occasions,
          sizes: product.sizes,
          stock: product.stock,
          productionHours: product.productionHours,
          images: product.images.length > 0 ? product.images : defaultImages(product.name),
          featured: product.featured,
          status: product.status,
        }
      : {
          name: '',
          description: '',
          price: 0,
          category: 'FIESTA',
          fabrics: EMPTY_FABRICS,
          occasions: EMPTY_OCCASIONS,
          sizes: EMPTY_SIZES,
          stock: 3,
          productionHours: 60,
          images: defaultImages('nuevo-vestido'),
          featured: false,
          status: 'PUBLICADO',
        },
  );
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ProductDraft>(field: K, value: ProductDraft[K]) {
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

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) {
      setError('El vestido necesita un nombre.');
      return;
    }
    if (!Number.isFinite(draft.price) || draft.price <= 0) {
      setError('Ingresá un precio válido mayor a cero.');
      return;
    }
    if (!draft.description.trim()) {
      setError('Escribí una descripción editorial para la ficha.');
      return;
    }

    const images = draft.images.map((i) => i.trim()).filter(Boolean);
    const safeImages = images.length > 0 ? images : defaultImages(name);

    const payload: ProductDraft = {
      ...draft,
      name,
      description: draft.description.trim(),
      price: Math.round(draft.price),
      stock: Math.max(0, Math.round(draft.stock)),
      productionHours: Math.max(1, Math.round(draft.productionHours)),
      images: safeImages,
    };

    if (product) {
      updateProduct(product.id, payload);
    } else {
      addProduct(payload);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />

      <form
        onSubmit={handleSave}
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
                value={draft.price || ''}
                onChange={(e) => updateField('price', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label" htmlFor="p-category">Categoría</label>
              <select
                id="p-category"
                className="field"
                value={draft.category}
                onChange={(e) => updateField('category', e.target.value as DressCategory)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
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

          {/* Multi-selección */}
          <div>
            <p className="label">Telas</p>
            <div className="flex flex-wrap gap-2">
              {FABRICS.map((fabric) => (
                <button
                  key={fabric}
                  type="button"
                  onClick={() => toggleIn('fabrics', fabric)}
                  className={cn(
                    'border px-3 py-1.5 text-xs transition-colors',
                    draft.fabrics.includes(fabric)
                      ? 'border-gold bg-gold text-charcoal'
                      : 'border-line bg-white hover:border-gold',
                  )}
                >
                  {fabric}
                </button>
              ))}
            </div>
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

          {/* Imágenes */}
          <div>
            <p className="flex items-center gap-2 label">
              <ImagePlus className="h-3.5 w-3.5" />
              Imágenes (URL)
            </p>
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <input
                  key={index}
                  className="field"
                  value={draft.images[index] ?? ''}
                  onChange={(e) => updateImage(index, e.target.value)}
                  placeholder={`URL de imagen ${index + 1}`}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-stone-400">
              Si dejás todo vacío generamos imágenes de muestra con el nombre del vestido.
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
                onChange={(e) => updateField('status', e.target.value as ProductDraft['status'])}
              >
                <option value="PUBLICADO">Publicado</option>
                <option value="PAUSADO">Pausado</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="border border-red-300/60 bg-red-50 px-4 py-2.5 text-xs text-red-700">
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
            className="bg-charcoal px-6 py-3 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
          >
            {product ? 'Guardar cambios' : 'Crear prenda'}
          </button>
        </div>
      </form>
    </div>
  );
}
