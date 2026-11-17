'use client';

import { ProductImage } from '@/components/ui/ProductImage';
import Link from 'next/link';
import { LogIn, Scissors } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useOrdersStore, selectOrdersByEmail } from '@/store/orders-store';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CUSTOM_SIZE, ORDER_STATUS_META, ORDER_STATUS_ORDER } from '@/lib/constants';
import { measurementsSummary } from '@/components/store/MeasurementsForm';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { useMounted } from '@/lib/hooks';
import type { Order } from '@/lib/types';

function OrderTimeline({ order }: { order: Order }) {
  return (
    <ol className="mt-5 space-y-0">
      {ORDER_STATUS_ORDER.map((status, index) => {
        const entry = order.history.find((h) => h.status === status);
        const done = Boolean(entry);
        const meta = ORDER_STATUS_META[status];
        const isLast = index === ORDER_STATUS_ORDER.length - 1;
        return (
          <li key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                  done ? meta.dot : 'bg-stone-300',
                )}
              />
              {!isLast && (
                <span
                  className={cn('w-px flex-1', done ? 'bg-gold/50' : 'bg-line')}
                  style={{ minHeight: 26 }}
                />
              )}
            </div>
            <div className={cn('pb-4', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-xs uppercase tracking-[0.14em]',
                  done ? 'text-charcoal' : 'text-stone-400',
                )}
              >
                {meta.label}
              </p>
              <p className="mt-0.5 text-[11px] text-stone-400">
                {done && entry ? formatDateTime(entry.at) : 'Pendiente'}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function MisPedidosPage() {
  const mounted = useMounted();
  const currentUser = useAuthStore((s) => s.currentUser);
  const orders = useOrdersStore((s) => s.orders);

  if (!mounted) {
    return <div className="mx-auto max-w-4xl px-5 py-24 lg:px-10" />;
  }

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl px-5 py-28 text-center">
        <LogIn className="mx-auto h-8 w-8 text-gold/60" />
        <h1 className="mt-5 font-display text-3xl text-charcoal">Ingresá para ver tus pedidos</h1>
        <p className="mt-3 text-sm text-stone-500">
          El seguimiento de cada confección queda asociado a tu cuenta.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block bg-charcoal px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const myOrders = selectOrdersByEmail(orders, currentUser.email).filter(
    (o) => o.customerId === currentUser.id || o.customerEmail.toLowerCase() === currentUser.email.toLowerCase(),
  );

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-10">
      <div className="text-center">
        <p className="eyebrow">Seguimiento</p>
        <h1 className="mt-3 font-display text-4xl text-charcoal">Mis pedidos</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-stone-500">
          Hola {currentUser.name.split(' ')[0]}, así viajan tus vestidos por el taller.
        </p>
      </div>

      {myOrders.length === 0 ? (
        <div className="mt-12 border border-line bg-white px-8 py-20 text-center">
          <Scissors className="mx-auto h-8 w-8 text-gold/60" />
          <p className="mt-4 font-display text-2xl text-charcoal">Todavía no tenés pedidos</p>
          <p className="mt-2 text-sm text-stone-500">
            Cuando confirmes tu primera confección, vas a ver cada paso acá.
          </p>
          <Link
            href="/coleccion"
            className="mt-7 inline-block bg-charcoal px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
          >
            Explorar la colección
          </Link>
        </div>
      ) : (
        <div className="mt-12 space-y-6">
          {myOrders.map((order) => (
            <article key={order.id} className="border border-line bg-white p-7">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
                <div>
                  <p className="font-display text-xl tracking-wider text-charcoal">{order.code}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-stone-400">
                    Pedido el {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="grid gap-8 pt-5 md:grid-cols-2">
                <div>
                  <ul className="space-y-4">
                    {order.items.map((item, index) => (
                      <li key={`${order.id}-item-${index}`} className="flex gap-4">
                        <div className="relative h-24 w-18 shrink-0 overflow-hidden bg-line" style={{ width: 72 }}>
                          <ProductImage
                            src={item.image}
                            alt={item.name}
                            fallbackLabel={item.name}
                            sizes="72px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-charcoal">{item.name}</p>
                          {item.size === CUSTOM_SIZE ? (
                            <p className="mt-1 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-gold-dark">
                              <Scissors className="h-3 w-3" />
                              A medida · {item.measurements ? measurementsSummary(item.measurements) : ''}
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-stone-500">
                              Talle {item.size} · x{item.quantity}
                            </p>
                          )}
                          <p className="mt-1 text-sm text-stone-500">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex justify-between border-t border-line pt-4 text-sm">
                    <span className="uppercase tracking-[0.16em] text-stone-500">Total</span>
                    <span className="text-charcoal">{formatCurrency(order.total)}</span>
                  </div>
                  {order.workshopNotes && (
                    <p className="mt-4 border border-gold/30 bg-gold/5 px-4 py-3 text-xs leading-relaxed text-gold-dark">
                      <span className="font-medium uppercase tracking-[0.14em]">Nota para el taller:</span>{' '}
                      {order.workshopNotes}
                    </p>
                  )}
                </div>

                <div>
                  <p className="label">Estado de la confección</p>
                  <OrderTimeline order={order} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
