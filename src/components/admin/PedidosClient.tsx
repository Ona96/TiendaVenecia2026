'use client';

import { useMemo, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import type { AdminOrderView } from '@/server/admin/orders';
import { OrderDetailModal } from '@/components/admin/OrderDetailModal';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { ORDER_STATUS_LABEL, ORDER_IN_PROGRESS } from '@/domain/state-machines';
import { formatCents } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@prisma/client';

/**
 * Listado de pedidos con datos REALES (Fase 3).
 * El estado solo cambia desde el detalle, con la máquina de estados.
 */
export function PedidosClient({ orders }: { orders: AdminOrderView[] }) {
  const [statusFilter, setStatusFilter] = useState<'TODOS' | OrderStatus>('TODOS');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AdminOrderView | null>(null);

  const ALL_FILTERS: ('TODOS' | OrderStatus)[] = [
    'TODOS',
    ...ORDER_IN_PROGRESS,
    'ENVIADO',
    'ENTREGADO',
    'CANCELADO',
  ];

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== 'TODOS' && order.status !== statusFilter) return false;
      if (normalized) {
        const haystack = `${order.code} ${order.shipName} ${order.email}`.toLowerCase();
        if (!haystack.includes(normalized)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, query]);

  const revenue = filtered.reduce((acc, o) => acc + o.totalCents, 0);

  return (
    <div className="p-6 lg:p-10">
      <div>
        <p className="eyebrow">Gestión</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Pedidos del taller</h1>
        <p className="mt-2 text-sm text-stone-500">
          {filtered.length} {filtered.length === 1 ? 'pedido' : 'pedidos'} ·{' '}
          {formatCents(revenue)} facturado en la selección
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código, clienta o email…"
            className="field pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'border px-4 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors',
                statusFilter === status
                  ? 'border-gold bg-gold text-charcoal'
                  : 'border-line bg-white text-stone-500 hover:border-gold',
              )}
            >
              {status === 'TODOS' ? 'Todos' : ORDER_STATUS_LABEL[status as OrderStatus]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-stone-400">
              <th className="px-5 py-3.5 font-medium">Pedido</th>
              <th className="px-5 py-3.5 font-medium">Clienta</th>
              <th className="px-5 py-3.5 font-medium">Prendas</th>
              <th className="px-5 py-3.5 font-medium">Total</th>
              <th className="px-5 py-3.5 font-medium">Estado</th>
              <th className="px-5 py-3.5 font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-stone-400">
                  No hay pedidos que coincidan con el filtro.
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-gold/5">
                  <td className="px-5 py-4">
                    <p className="text-charcoal">{order.code}</p>
                    <p className="text-[11px] text-stone-400">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-charcoal">{order.shipName}</p>
                    <p className="text-[11px] text-stone-400">{order.email}</p>
                  </td>
                  <td className="px-5 py-4 text-charcoal">
                    {order.items.reduce((acc, item) => acc + item.quantity, 0)}
                    {order.items.some((i) => i.madeToMeasure) && (
                      <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-gold-dark">
                        a medida
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-charcoal">{formatCents(order.totalCents)}</td>
                  <td className="px-5 py-4">
                    <AdminStatusBadge status={order.status as OrderStatus} />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelected(order)}
                      className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-gold-dark transition-colors hover:text-charcoal"
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <OrderDetailModal key={selected.id} order={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
