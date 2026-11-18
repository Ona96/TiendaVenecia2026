'use client';

import { useState, useTransition } from 'react';
import { Check, Plus, Wallet, X } from 'lucide-react';
import type { AdminOrderView } from '@/server/admin/orders';
import { updateOrderStatus, registerDeposit, verifyDeposit } from '@/server/admin/actions';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { ORDER_STATUS_LABEL, ORDER_TRANSITIONS } from '@/domain/state-machines';
import { formatCents } from '@/lib/money';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
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

  // Pagos: comprometido = todo lo no rechazado/reembolsado.
  const committedCents = order.payments
    .filter((p) => p.status !== 'RECHAZADO' && p.status !== 'REEMBOLSADO')
    .reduce((acc, p) => acc + p.amountCents, 0);

  function changeStatus(next: OrderStatus) {
    setError(null);
    start(async () => {
      const result = await updateOrderStatus(order.id, next);
      if (!result.ok) setError(result.error);
      else onClose();
    });
  }

  function runDeposit(amountArs: number) {
    setError(null);
    start(async () => {
      const result = await registerDeposit(order.id, amountArs);
      if (!result.ok) setError(result.error);
    });
  }

  function runVerify(paymentId: string, verified: boolean) {
    setError(null);
    start(async () => {
      const result = await verifyDeposit(paymentId, verified);
      if (!result.ok) setError(result.error);
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

          {/* Pagos: señas y saldos (Fase 5) */}
          <div className="border border-line bg-white p-5">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-charcoal">
              <Wallet className="h-4 w-4 text-gold-dark" />
              Pagos y saldo
            </p>

            <ul className="mt-4 space-y-2 text-sm">
              {order.payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 border border-line px-3 py-2"
                >
                  <div>
                    <p className="text-charcoal">{formatCents(payment.amountCents)}</p>
                    <p className="text-[11px] text-stone-400">
                      {payment.method === 'TRANSFERENCIA' ? 'Transferencia' : 'Mercado Pago'} ·{' '}
                      {payment.declaredAt ? `declarado ${formatDate(payment.declaredAt)}` : ' inicial'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]',
                        payment.status === 'VERIFICADO' && 'bg-success-soft text-success',
                        payment.status === 'PENDIENTE' && 'bg-warn-soft text-warn',
                        payment.status === 'PENDIENTE_VERIFICACION' && 'bg-gold/15 text-gold-dark',
                        payment.status === 'RECHAZADO' && 'bg-error-soft text-error',
                      )}
                    >
                      {payment.status.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    {payment.status === 'PENDIENTE_VERIFICACION' && (
                      <span className="flex gap-1">
                        <button
                          onClick={() => runVerify(payment.id, true)}
                          disabled={pending}
                          aria-label="Verificar pago"
                          className="border border-success/40 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-success transition-colors hover:bg-success-soft disabled:opacity-40"
                        >
                          Verificar
                        </button>
                        <button
                          onClick={() => runVerify(payment.id, false)}
                          disabled={pending}
                          aria-label="Rechazar pago"
                          className="border border-error/40 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-error transition-colors hover:bg-error-soft disabled:opacity-40"
                        >
                          Rechazar
                        </button>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Comprometido</span>
                <span className="text-charcoal">{formatCents(committedCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Saldo</span>
                <span className="font-medium text-charcoal">
                  {formatCents(Math.max(0, order.totalCents - committedCents))}
                </span>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                const input = (event.currentTarget.elements.namedItem('seña') as HTMLInputElement) ?? null;
                const amount = Number(input?.value);
                if (!amount) return;
                runDeposit(Math.round(amount));
                if (input) input.value = '';
              }}
              className="mt-4 flex gap-2"
            >
              <input
                name="seña"
                type="number"
                min={1000}
                step={1000}
                placeholder="Seña en pesos…"
                aria-label="Monto de la seña en pesos"
                className="field py-2"
              />
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-1.5 border border-charcoal/25 px-4 text-[10px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Seña
              </button>
            </form>
            <p className="mt-2 text-[11px] text-stone-400">
              La seña queda «por verificar» hasta que controles el banco: el comprobante por sí
              solo nunca marca «pagado».
            </p>
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
