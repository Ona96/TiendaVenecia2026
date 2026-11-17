'use client';

/* ============================================================
   Store del catálogo de prendas (CRUD)
   Lo consume el storefront y el backoffice de gestión de vestidos.
   ============================================================ */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '@/lib/types';
import { seedProducts } from '@/data/mock-data';
import { generateId, nowIso, slugify } from '@/lib/utils';

export type ProductDraft = Omit<Product, 'id' | 'slug' | 'createdAt' | 'status'> &
  Partial<Pick<Product, 'status'>>;

interface CatalogState {
  products: Product[];
  addProduct: (draft: ProductDraft) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductStatus: (id: string) => void;
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      products: seedProducts,

      addProduct: (draft) => {
        const product: Product = {
          ...draft,
          id: generateId('p'),
          slug: slugify(draft.name),
          status: draft.status ?? 'PUBLICADO',
          createdAt: nowIso(),
        };
        set({ products: [product, ...get().products] });
        return product;
      },

      updateProduct: (id, patch) =>
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, ...patch, slug: patch.name ? slugify(patch.name) : p.slug } : p,
          ),
        }),

      deleteProduct: (id) => set({ products: get().products.filter((p) => p.id !== id) }),

      toggleProductStatus: (id) =>
        set({
          products: get().products.map((p) =>
            p.id === id
              ? { ...p, status: p.status === 'PUBLICADO' ? 'PAUSADO' : 'PUBLICADO' }
              : p,
          ),
        }),
    }),
    {
      name: 'venecia-catalog',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function selectPublishedProducts(products: Product[]): Product[] {
  return products.filter((p) => p.status === 'PUBLICADO');
}

export function selectProductById(products: Product[], id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
