'use client';

import { Ruler, Save, X } from 'lucide-react';
import { useCustomersStore } from '@/store/customers-store';
import { useOrdersStore, selectOrdersByEmail } from '@/store/orders-store';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Customer } from '@/lib/types';

interface CustomerDetailModalProps {
  customerId: string;
  onClose: () => void;
}

export function CustomerDetailModal({ customerId, onClose }: CustomerDetailModalProps) {
  const customers = useCustomersStore((s) => s.customers);
  const updateCustomer = useCustomersStore((s) => s.updateCustomer);
  const orders = useOrdersStore((s) => s.orders);

  const customer = customers.find((c) => c.id === customerId);
  if (!customer) return null;

  const customerOrders = selectOrdersByEmail(orders, customer.email);
  const totalSpent = customerOrders.reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-ivory shadow-luxe">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-ivory px-7 py-5">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 bg-gold/10 font-display text-lg text-gold-dark">
              {customer.name.charAt(0)}
            </span>
            <div>
              <p className="font-display text-2xl text-charcoal">{customer.name}</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">
                Clienta desde {formatDate(customer.registeredAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center text-charcoal transition-colors hover:bg-gold/10 hover:text-gold-dark"
            aria-label="Cerrar detalle"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-7 px-7 py-6">
          {/* Datos y totales */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-line bg-white p-5 text-sm">
              <p className="label">Contacto</p>
              <p className="text-charcoal">{customer.email}</p>
              <p className="text-stone-500">{customer.phone || 'Sin teléfono registrado'}</p>
              <p className="mt-3 text-stone-500">{customer.city || '—'}</p>
            </div>
            <div className="border border-line bg-white p-5 text-sm">
              <p className="label">Actividad</p>
              <div className="flex items-baseline justify-between">
                <span className="text-stone-500">Pedidos</span>
                <span className="text-charcoal">{customerOrders.length}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-stone-500">Total gastado</span>
                <span className="text-base text-gold-dark">{formatCurrency(totalSpent)}</span>
              </div>
            </div>
          </div>

          {/* Medidas guardadas */}
          <div className="border border-line bg-white p-5">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-charcoal">
              <Ruler className="h-4 w-4 text-gold-dark" />
              Medidas guardadas
            </p>
            {customer.savedMeasurements ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Busto', value: customer.savedMeasurements.busto },
                  { label: 'Cintura', value: customer.savedMeasurements.cintura },
                  { label: 'Cadera', value: customer.savedMeasurements.cadera },
                  { label: 'Largo', value: customer.savedMeasurements.largo },
                ].map((m) => (
                  <div key={m.label} className="border border-line p-3 text-center">
                    <p className="font-display text-xl text-charcoal">{m.value}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-stone-400">
                      {m.label} (cm)
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-stone-400">
                Sin medidas registradas todavía.
              </p>
            )}
          </div>

          {/* Notas del atelier (editables) */}
          <div className="border border-line bg-white p-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const textarea = e.currentTarget.elements.namedItem('notes') as HTMLTextAreaElement;
                updateCustomer(customer.id, { notes: textarea.value });
                onClose();
              }}
            >
              <label className="label" htmlFor="atelier-notes">
                Notas del atelier (privadas)
              </label>
              <textarea
                id="atelier-notes"
                name="notes"
                rows={3}
                defaultValue={customer.notes ?? ''}
                placeholder="Preferencias de calce, telas, alergias, referencias estéticas…"
                className="field resize-none"
              />
              <button
                type="submit"
                className="mt-4 inline-flex items-center gap-2 bg-charcoal px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-charcoal-soft"
              >
                <Save className="h-3.5 w-3.5" />
                Guardar notas
              </button>
            </form>
          </div>

          {/* Historial de compras */}
          <div>
            <p className="label">Historial de compras</p>
            {customerOrders.length === 0 ? (
              <p className="border border-line bg-white px-5 py-8 text-center text-sm text-stone-400">
                Esta clienta todavía no registró pedidos.
              </p>
            ) : (
              <ul className="divide-y divide-line border border-line bg-white">
                {[...customerOrders]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((order) => (
                    <li
                      key={order.id}
                      className={cn('flex flex-wrap items-center justify-between gap-3 px-5 py-4')}
                    >
                      <div>
                        <p className="text-sm text-charcoal">{order.code}</p>
                        <p className="text-[11px] text-stone-400">
                          {formatDate(order.createdAt)} ·{' '}
                          {order.items.reduce((acc, i) => acc + i.quantity, 0)} prenda(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-charcoal">{formatCurrency(order.total)}</p>
                        <StatusBadge status={order.status} />
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
