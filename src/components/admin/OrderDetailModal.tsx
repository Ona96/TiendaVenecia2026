'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { useOrdersStore } from '@/store/orders-store';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ORDER_STATUS_META, ORDER_STATUS_ORDER, CUSTOM_SIZE } from '@/lib/constants';
import { measurementsSummary } from '@/components/store/MeasurementsForm';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
}

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const orders = useOrdersStore((s) => s.orders);
  const updateOrderStatus = useOrdersStore((s) => s.updateOrderStatus);
  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;

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
          {/* Estado + cambio en vivo */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="label">Estado actual</p>
              <StatusBadge status={order.status} />
            </div>
            <div>
              <label className="label" htmlFor="order-status-select">
                Actualizar estado del taller
              </label>
              <select
                id="order-status-select"
                value={order.status}
                onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                className="field"
              >
                {ORDER_STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_META[status].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clienta y envío */}
          <div className="grid gap-4 border border-line bg-white p-5 text-sm sm:grid-cols-2">
            <div>
              <p className="label">Clienta</p>
              <p className="text-charcoal">{order.customerName}</p>
              <p className="text-stone-500">{order.customerEmail}</p>
            </div>
            <div>
              <p className="label">Envío</p>
              <p className="text-charcoal">{order.shippingAddress}</p>
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

          {/* Prendas */}
          <div>
            <p className="label">Prendas del pedido</p>
            <ul className="divide-y divide-line border border-line bg-white">
              {order.items.map((item, index) => (
                <li key={`${order.id}-detail-${index}`} className="flex gap-4 p-4">
                  <div className="relative h-24 w-18 shrink-0 overflow-hidden bg-line" style={{ width: 72 }}>
                    <Image src={item.image} alt={item.name} fill sizes="72px" className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-charcoal">{item.name}</p>
                    {item.size === CUSTOM_SIZE ? (
                      <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-gold-dark">
                        Confección a medida
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-stone-500">
                        Talle {item.size} · x{item.quantity}
                      </p>
                    )}
                    {item.measurements && (
                      <p className="mt-1 text-[11px] text-stone-500">
                        Busto {item.measurements.busto} · Cintura {item.measurements.cintura} ·
                        Cadera {item.measurements.cadera} · Largo {item.measurements.largo} cm
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-charcoal">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd className="text-charcoal">{formatCurrency(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Envío</dt>
                <dd className="text-charcoal">
                  {order.shipping === 0 ? 'Gratis' : formatCurrency(order.shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base">
                <dt className="uppercase tracking-[0.16em] text-charcoal">Total</dt>
                <dd className="font-medium text-charcoal">{formatCurrency(order.total)}</dd>
              </div>
            </dl>
          </div>

          {/* Historial */}
          <div>
            <p className="label">Historial del pedido</p>
            <ol className="space-y-2">
              {[...order.history].reverse().map((entry, index) => (
                <li key={`${order.id}-hist-${index}`} className="flex items-center gap-3 text-xs">
                  <span className={cn('h-2 w-2 rounded-full', ORDER_STATUS_META[entry.status].dot)} />
                  <span className="text-charcoal">{ORDER_STATUS_META[entry.status].label}</span>
                  <span className="text-stone-400">{formatDateTime(entry.at)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
