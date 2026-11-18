import Link from 'next/link';
import { LogIn, Package } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/server/db';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { ProductImage } from '@/components/ui/ProductImage';
import { ORDER_STATUS_LABEL } from '@/domain/state-machines';
import { formatCents } from '@/lib/money';
import { formatDate, formatDateTime } from '@/lib/utils';
import { CUSTOM_SIZE } from '@/lib/constants';
import type { OrderStatus } from '@prisma/client';

/**
 * Mis pedidos (Fase 4): órdenes REALES de la clienta logueada.
 * Server Component con sesión httpOnly: la clienta solo puede ver lo suyo
 * (RLS refuerza, pero ni siquiera consultamos datos ajenos).
 */
export default async function MisPedidosPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-5 py-28 text-center">
        <LogIn className="mx-auto h-8 w-8 text-gold/60" />
        <h1 className="mt-5 font-display text-3xl text-charcoal">Ingresá para ver tus pedidos</h1>
        <p className="mt-3 text-sm text-stone-500">
          El seguimiento de cada confección queda asociado a tu cuenta.
        </p>
        <Link
          href="/login?next=/mis-pedidos"
          className="mt-8 inline-block bg-charcoal px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { profileId: user.id },
    include: {
      items: true,
      history: { orderBy: { at: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-10">
      <div className="text-center">
        <p className="eyebrow">Seguimiento</p>
        <h1 className="mt-3 font-display text-4xl text-charcoal">Mis pedidos</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-stone-500">
          Así viajan tus vestidos por el taller.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="mt-12 border border-line bg-white px-8 py-20 text-center">
          <Package className="mx-auto h-8 w-8 text-gold/60" />
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
        <ul className="mt-12 space-y-8">
          {orders.map((order) => (
            <li key={order.id} className="border border-line bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
                <div>
                  <p className="font-display text-lg tracking-wider text-charcoal">{order.code}</p>
                  <p className="text-[11px] text-stone-400">{formatDate(order.createdAt.toISOString())}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-charcoal">{formatCents(order.totalCents)}</p>
                  <AdminStatusBadge status={order.status as OrderStatus} />
                </div>
              </div>

              <ul className="divide-y divide-line px-6">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 py-4">
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-line">
                      <ProductImage
                        src={item.imageSnapshot ?? ''}
                        alt={item.nameSnapshot}
                        fallbackLabel={item.nameSnapshot}
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="text-sm text-charcoal">{item.nameSnapshot}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-stone-500">
                        {item.madeToMeasure || item.size === CUSTOM_SIZE
                          ? 'Confección a medida'
                          : `Talle ${item.size}`}{' '}
                        · x{item.quantity}
                      </p>
                    </div>
                    <p className="text-xs text-charcoal">
                      {formatCents(item.unitPriceCents * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="border-t border-line px-6 py-4">
                <p className="label">Recorrido</p>
                <ol className="mt-2 space-y-1.5">
                  {[...order.history].reverse().map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-center gap-2 text-xs">
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold/70" />
                      <span className="text-charcoal">
                        {entry.from
                          ? `${ORDER_STATUS_LABEL[entry.from as OrderStatus]} → `
                          : ''}
                        {ORDER_STATUS_LABEL[entry.to as OrderStatus]}
                      </span>
                      <span className="text-stone-400">{formatDateTime(entry.at.toISOString())}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
