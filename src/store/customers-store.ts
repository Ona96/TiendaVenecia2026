'use client';

/* ============================================================
   Store de clientas
   Se alimenta del registro de compras y guarda medidas del atelier.
   ============================================================ */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CustomMeasurements, Customer } from '@/lib/types';
import { seedCustomers } from '@/data/mock-data';
import { generateId, nowIso } from '@/lib/utils';

export type CustomerDraft = Omit<Customer, 'id' | 'registeredAt'>;

interface CustomersState {
  customers: Customer[];
  upsertCustomer: (draft: CustomerDraft) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  saveMeasurements: (id: string, measurements: CustomMeasurements) => void;
}

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: seedCustomers,

      upsertCustomer: (draft) => {
        const existing = get().customers.find(
          (c) => c.email.toLowerCase() === draft.email.toLowerCase(),
        );
        if (existing) {
          set({
            customers: get().customers.map((c) =>
              c.id === existing.id ? { ...c, ...draft, id: existing.id } : c,
            ),
          });
          return existing;
        }
        const customer: Customer = { ...draft, id: generateId('c'), registeredAt: nowIso() };
        set({ customers: [customer, ...get().customers] });
        return customer;
      },

      updateCustomer: (id, patch) =>
        set({
          customers: get().customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }),

      saveMeasurements: (id, measurements) =>
        set({
          customers: get().customers.map((c) =>
            c.id === id ? { ...c, savedMeasurements: measurements } : c,
          ),
        }),
    }),
    {
      name: 'venecia-customers',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
