'use client';

/* ============================================================
   Store del carrito
   Items con talle estándar o A_MEDIDA, notas para el taller
   y estado del drawer deslizante.
   ============================================================ */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, CustomMeasurements } from '@/lib/types';

export interface AddToCartInput {
  productId: string;
  name: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
  measurements?: CustomMeasurements;
}

interface CartState {
  items: CartItem[];
  workshopNotes: string;
  isDrawerOpen: boolean;
  addToCart: (input: AddToCartInput) => void;
  removeFromCart: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  setWorkshopNotes: (notes: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export function cartItemKey(productId: string, size: string, measurements?: CustomMeasurements) {
  const measureKey = measurements
    ? `${measurements.busto}-${measurements.cintura}-${measurements.cadera}-${measurements.largo}`
    : 'std';
  return `${productId}::${size}::${measureKey}`;
}

export const selectCartCount = (items: CartItem[]) =>
  items.reduce((acc, item) => acc + item.quantity, 0);

export const selectCartSubtotal = (items: CartItem[]) =>
  items.reduce((acc, item) => acc + item.price * item.quantity, 0);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      workshopNotes: '',
      isDrawerOpen: false,

      addToCart: (input) => {
        const key = cartItemKey(input.productId, input.size, input.measurements);
        const existing = get().items.find((item) => item.key === key);
        if (existing) {
          set({
            items: get().items.map((item) =>
              item.key === key ? { ...item, quantity: item.quantity + input.quantity } : item,
            ),
          });
        } else {
          const item: CartItem = {
            key,
            productId: input.productId,
            name: input.name,
            image: input.image,
            price: input.price,
            size: input.size,
            quantity: input.quantity,
            measurements: input.measurements,
          };
          set({ items: [...get().items, item] });
        }
        set({ isDrawerOpen: true });
      },

      removeFromCart: (key) => set({ items: get().items.filter((item) => item.key !== key) }),

      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((item) => item.key !== key) });
          return;
        }
        set({
          items: get().items.map((item) => (item.key === key ? { ...item, quantity } : item)),
        });
      },

      setWorkshopNotes: (notes) => set({ workshopNotes: notes }),

      clearCart: () => set({ items: [], workshopNotes: '' }),

      openCart: () => set({ isDrawerOpen: true }),
      closeCart: () => set({ isDrawerOpen: false }),
    }),
    {
      name: 'venecia-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, workshopNotes: state.workshopNotes }),
    },
  ),
);
