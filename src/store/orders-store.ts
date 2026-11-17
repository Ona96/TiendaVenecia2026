'use client';

/* ============================================================
   Store de pedidos
   El checkout crea órdenes reales que impactan el panel admin,
   y el admin actualiza estados que refleja "Mis Pedidos".
   ============================================================ */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Order, OrderItem, OrderStatus } from '@/lib/types';
import { seedOrders } from '@/data/mock-data';
import { nextOrderCode, nowIso } from '@/lib/utils';

export interface CreateOrderInput {
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  shippingAddress: string;
  workshopNotes?: string;
}

interface OrdersState {
  orders: Order[];
  createOrder: (input: CreateOrderInput) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: seedOrders,

      createOrder: (input) => {
        const at = nowIso();
        const order: Order = {
          id: `o_${Date.now().toString(36)}`,
          code: nextOrderCode(get().orders.length),
          customerId: input.customerId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          items: input.items,
          subtotal: input.subtotal,
          shipping: input.shipping,
          total: input.subtotal + input.shipping,
          status: 'PENDIENTE',
          shippingAddress: input.shippingAddress,
          workshopNotes: input.workshopNotes,
          createdAt: at,
          updatedAt: at,
          history: [{ status: 'PENDIENTE', at }],
        };
        set({ orders: [order, ...get().orders] });
        return order;
      },

      updateOrderStatus: (id, status) =>
        set({
          orders: get().orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  updatedAt: nowIso(),
                  history: [...o.history, { status, at: nowIso() }],
                }
              : o,
          ),
        }),
    }),
    {
      name: 'venecia-orders',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function selectOrdersByCustomer(orders: Order[], customerId: string): Order[] {
  return orders
    .filter((o) => o.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function selectOrdersByEmail(orders: Order[], email: string): Order[] {
  const normalized = email.toLowerCase();
  return orders
    .filter((o) => o.customerEmail.toLowerCase() === normalized)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
