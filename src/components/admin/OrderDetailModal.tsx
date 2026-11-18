'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import type { AdminOrderView } from '@/server/admin/orders';
import { updateOrderStatus } from '@/server/admin/actions';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { ORDER_STATUS_LABEL, ORDER_TRANSITIONS } from '@/domain/state-machines';
import { formatCents } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';
import { ProductImage } from '@/components/ui/ProductImage';
import type { OrderStatus } from '@prisma/client';

/**
 * Detalle de pedido con datos REALES (Fase 3).
 * El cambio de estado lo valida la máquina de estados EN EL SERVIDOR
 * (action) y queda en el historial auditable.
 */
export function OrderDetailModal({ order, onClose }: { order: AdminOrderView; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const current = order.status as OrderStatus;
  const allowed = ORDER_TRANSITIONS[current] ?? [];

  function changeStatus(next: OrderStatus) {
    setError(null);
    start(async () => {
      const result = await updateOrderStatus(order.id, next);
      if (!result.ok) setError(result.error);
      else onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-ivory shadow-luxe">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-ivory px-7 py-5">
          <div>
            <p className="font-display text-2xl tracking-wider text-charcoal">{order.code}</p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">
              Creado {formatDateTime(order.createdAt)}
            </p>
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
          {/* Estado + transiciones legales */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="label">Estado actual</p>
              <AdminStatusBadge status={current} />
            </div>
            <div>
              <p className="label">Pasar a…</p>
              {allowed.length === 0 ? (
                <p className="text-xs text-stone-500">Estado final: no hay transiciones.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allowed.map((next) => (
                    <button
                      key={next}
                      onClick={() => changeStatus(next)}
                      disabled={pending}
                      className="border border-charcoal/25 bg-white px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
                    >
                      {ORDER_STATUS_LABEL[next]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="border border-error-soft bg-error-soft px-4 py-2.5 text-xs text-error">
              {error}
            </p>
          )}

          {/* Clienta y envío */}
          <div className="grid gap-4 border border-line bg-white p-5 text-sm sm:grid-cols-2">
            <div>
              <p className="label">Clienta</p>
              <p className="text-charcoal">{order.shipName}</p>
              <p className="text-stone-500">{order.email}</p>
              <p className="text-stone-500">{order.shipPhone}</p>
            </div>
            <div>
              <p className="label">Envío</p>
              <p className="text-charcoal">
                {order.shipStreet} · {order.shipCity}, {order.shipProvince}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-stone-400">
                {order.shippingStatus.replace(/_/g, ' ').toLowerCase()}
              </p>
            </div>
            {order.workshopNotes && (
              <div className="sm:col-span-2">
                <p className="label">Notas para el taller</p>
                <p className="border border-gold/30 bg-gold/5 px-3 py-2 text-xs leading-relaxed text-gold-dark">
                  {order.workshopNotes}
                </p>
              </div>
            )}
          </div>

          {/* Prendas (snapshots inmutables) */}
          <div>
            <p className="label">Prendas del pedido</p>
            <ul className="divide-y divide-line border border-line bg-white">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 p-4">
                  <div className="relative h-24 w-[72px] shrink-0 overflow-hidden bg-line">
                    <ProductImage
                      src={item.image ?? ''}
                      alt={item.name}
                      fallbackLabel={item.name}
                      sizes="72px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-charcoal">{item.name}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-stone-500">
                      {item.madeToMeasure ? 'A medida' : `Talle ${item.size}`} · x{item.quantity}
                    </p>
                  </div>
                  <p className="text-sm text-charcoal">
                    {formatCents(item.unitPriceCents * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd className="text-charcoal">{formatCents(order.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Envío</dt>
                <dd className="text-charcoal">
                  {order.shippingCents === 0 ? 'Gratis' : formatCents(order.shippingCents)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base">
                <dt className="uppercase tracking-[0.16em] text-charcoal">Total</dt>
                <dd className="font-medium text-charcoal">{formatCents(order.totalCents)}</dd>
              </div>
            </dl>
          </div>

          {/* Historial auditable */}
          <div>
            <p className="label">Historial del pedido</p>
            <ol className="space-y-2">
              {[...order.history].reverse().map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-2 text-xs">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-gold/60" />
                  <span className="text-charcoal">
                    {entry.from ? `${ORDER_STATUS_LABEL[entry.from as OrderStatus]} → ` : ''}
                    {ORDER_STATUS_LABEL[entry.to as OrderStatus]}
                  </span>
                  <span className="text-stone-400">{formatDateTime(entry.at)}</span>
                  {entry.note && <span className="text-stone-400">· {entry.note}</span>}
                </li>
              ))}
              {order.history.length === 0 && (
                <li className="text-xs text-stone-400">Sin cambios de estado registrados.</li>
              )}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
