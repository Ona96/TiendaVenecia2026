'use client';

import { useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '@/components/store/ProductCard';
import { QuickViewModal } from '@/components/store/QuickViewModal';
import {
  CATEGORIES,
  FABRICS,
  OCCASIONS,
  STANDARD_SIZES,
} from '@/lib/constants';
import { formatCurrency, cn } from '@/lib/utils';
import type { DressCategory, Product } from '@/lib/types';

type SortKey = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nuevos';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'relevancia', label: 'Destacados primero' },
  { value: 'nuevos', label: 'Más nuevos' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
];

/**
 * Colección con datos REALES (Fase 4): el Server Component pasa el
 * catálogo publicado desde la base; acá solo se filtra/ordena en cliente
 * (filtros de facetas, sin datos sensibles).
 */
export function ColeccionClient({ products }: { products: Product[] }) {
  const published = products;

  const [categories, setCategories] = useState<DressCategory[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [fabrics, setFabrics] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('relevancia');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);

  // Techo de precio derivado del catálogo: null = "sin límite custom".
  const priceCeiling = useMemo(() => {
    if (published.length === 0) return 1000000;
    return Math.ceil(Math.max(...published.map((p) => p.price)) / 10000) * 10000;
  }, [published]);
  const [maxPriceOverride, setMaxPriceOverride] = useState<number | null>(null);
  const maxPrice = maxPriceOverride ?? priceCeiling;

  function toggleIn<T>(list: T[], value: T, setList: (next: T[]) => void) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = published.filter((p) => {
      if (categories.length > 0 && !categories.includes(p.category)) return false;
      if (sizes.length > 0 && !p.sizes.some((s) => sizes.includes(s))) return false;
      if (fabrics.length > 0 && !p.fabrics.some((f) => fabrics.includes(f))) return false;
      if (occasions.length > 0 && !p.occasions.some((o) => occasions.includes(o))) return false;
      if (onlyInStock && p.stock <= 0) return false;
      if (p.price > maxPrice) return false;
      if (normalizedQuery) {
        const haystack = `${p.name} ${p.description} ${p.fabrics.join(' ')}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });

    switch (sort) {
      case 'precio-asc':
        return [...result].sort((a, b) => a.price - b.price);
      case 'precio-desc':
        return [...result].sort((a, b) => b.price - a.price);
      case 'nuevos':
        return [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      default:
        return [...result].sort(
          (a, b) => Number(b.featured) - Number(a.featured) || a.price - b.price,
        );
    }
  }, [published, categories, sizes, fabrics, occasions, onlyInStock, maxPrice, query, sort]);

  function clearFilters() {
    setCategories([]);
    setSizes([]);
    setFabrics([]);
    setOccasions([]);
    setOnlyInStock(false);
    setMaxPriceOverride(null);
    setQuery('');
  }

  const activeFilterCount =
    categories.length +
    sizes.length +
    fabrics.length +
    occasions.length +
    (onlyInStock ? 1 : 0) +
    (maxPriceOverride !== null ? 1 : 0) +
    (query ? 1 : 0);

  const filterPanel = (
    <div className="space-y-7">
      <div>
        <p className="label">Buscar</p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Aurelia, encaje…"
          className="field"
        />
      </div>

      <div>
        <p className="label">Categoría</p>
        <ul className="space-y-2">
          {CATEGORIES.map((cat) => (
            <li key={cat.value}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal/80">
                <input
                  type="checkbox"
                  checked={categories.includes(cat.value)}
                  onChange={() => toggleIn(categories, cat.value, setCategories)}
                  className="h-3.5 w-3.5 accent-[#C5A059]"
                />
                {cat.label}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="label">Talle</p>
        <div className="flex flex-wrap gap-2">
          {STANDARD_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleIn(sizes, size, setSizes)}
              className={cn(
                'min-w-[42px] border px-3 py-1.5 text-xs tracking-widest transition-colors',
                sizes.includes(size)
                  ? 'border-gold bg-gold text-charcoal'
                  : 'border-line bg-white hover:border-gold',
              )}
            >
              {size}
            </button>
          ))}
          <span className="self-center text-[10px] uppercase tracking-[0.14em] text-stone-400">
            + a medida
          </span>
        </div>
      </div>

      <div>
        <p className="label">Tela</p>
        <ul className="space-y-2">
          {FABRICS.map((fabric) => (
            <li key={fabric}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal/80">
                <input
                  type="checkbox"
                  checked={fabrics.includes(fabric)}
                  onChange={() => toggleIn(fabrics, fabric, setFabrics)}
                  className="h-3.5 w-3.5 accent-[#C5A059]"
                />
                {fabric}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="label">Ocasión</p>
        <ul className="space-y-2">
          {OCCASIONS.map((occasion) => (
            <li key={occasion}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal/80">
                <input
                  type="checkbox"
                  checked={occasions.includes(occasion)}
                  onChange={() => toggleIn(occasions, occasion, setOccasions)}
                  className="h-3.5 w-3.5 accent-[#C5A059]"
                />
                {occasion}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="label">Precio hasta {formatCurrency(maxPrice)}</p>
        <input
          type="range"
          min={100000}
          max={priceCeiling}
          step={10000}
          value={maxPrice}
          onChange={(e) => setMaxPriceOverride(Number(e.target.value))}
          className="w-full accent-[#C5A059]"
        />
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal/80">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#C5A059]"
          />
          Solo con cupos de producción
        </label>
      </div>

      <button
        onClick={clearFilters}
        className="text-[11px] uppercase tracking-[0.18em] text-stone-500 underline-offset-4 transition-colors hover:text-gold-dark hover:underline"
      >
        Limpiar filtros ({activeFilterCount})
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-10">
      <div className="text-center">
        <p className="eyebrow">Catálogo</p>
        <h1 className="mt-3 font-display text-4xl text-charcoal">La Colección</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
          Cada vestido se confecciona por encargo, en talle estándar o a medida sobre tus
          medidas exactas.
        </p>
      </div>

      <div className="mt-10 flex items-center justify-between border-y border-line py-3">
        <button
          onClick={() => setMobileFiltersOpen((v) => !v)}
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-charcoal/70 transition-colors hover:text-gold-dark lg:hidden"
        >
          {mobileFiltersOpen ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
          Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
          {filtered.length} {filtered.length === 1 ? 'vestido' : 'vestidos'}
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="border border-line bg-white px-3 py-2 text-xs text-charcoal outline-none focus:border-gold"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{filterPanel}</div>
        </aside>

        {mobileFiltersOpen && (
          <div className="border border-line bg-white p-6 lg:hidden">{filterPanel}</div>
        )}

        <div>
          {filtered.length === 0 ? (
            <div className="border border-line bg-white px-8 py-20 text-center">
              <p className="font-display text-2xl text-charcoal">Ningún vestido coincide</p>
              <p className="mt-2 text-sm text-stone-500">
                Probá quitar algún filtro: también podemos confeccionarlo a medida.
              </p>
              <button
                onClick={clearFilters}
                className="mt-6 bg-charcoal px-6 py-3 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
              >
                Ver toda la colección
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setQuickView(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {quickView && (
        <QuickViewModal
          key={quickView.id}
          product={quickView}
          onClose={() => setQuickView(null)}
        />
      )}
    </div>
  );
}
