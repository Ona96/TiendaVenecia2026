'use client';

import { useMemo, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { useOrdersStore } from '@/store/orders-store';
import { OrderDetailModal } from '@/components/admin/OrderDetailModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ORDER_STATUS_META, ORDER_STATUS_ORDER } from '@/lib/constants';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useMounted } from '@/lib/hooks';
import type { Order, OrderStatus } from '@/lib/types';

type StatusFilter = 'TODOS' | OrderStatus;

export default function AdminPedidosPage() {
  const mounted = useMounted();
  const orders = useOrdersStore((s) => s.orders);
  const updateOrderStatus = useOrdersStore((s) => s.updateOrderStatus);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS');
  const [query, setQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders
      .filter((order) => {
        if (statusFilter !== 'TODOS' && order.status !== statusFilter) return false;
        if (normalized) {
          const haystack = `${order.code} ${order.customerName} ${order.customerEmail}`.toLowerCase();
          if (!haystack.includes(normalized)) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, statusFilter, query]);

  if (!mounted) {
    return <div className="p-10" />;
  }

  const filteredRevenue = filtered.reduce((acc, order) => acc + order.total, 0);

  return (
    <div className="p-6 lg:p-10">
      <div>
        <p className="eyebrow">Gestión</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Pedidos del taller</h1>
        <p className="mt-2 text-sm text-stone-500">
          {filtered.length} {filtered.length === 1 ? 'pedido' : 'pedidos'} ·{' '}
          {formatCurrency(filteredRevenue)} facturado en la selección
        </p>
      </div>

      {/* Controles */}
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
          <button
            onClick={() => setStatusFilter('TODOS')}
            className={cn(
              'border px-4 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors',
              statusFilter === 'TODOS'
                ? 'border-gold bg-gold text-charcoal'
                : 'border-line bg-white text-stone-500 hover:border-gold',
            )}
          >
            Todos
          </button>
          {ORDER_STATUS_ORDER.map((status) => (
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
              {ORDER_STATUS_META[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
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
                    <p className="text-charcoal">{order.customerName}</p>
                    <p className="text-[11px] text-stone-400">{order.customerEmail}</p>
                  </td>
                  <td className="px-5 py-4 text-charcoal">
                    {order.items.reduce((acc, item) => acc + item.quantity, 0)}
                    {order.items.some((i) => i.size === 'A_MEDIDA') && (
                      <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-gold-dark">
                        a medida
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-charcoal">{formatCurrency(order.total)}</td>
                  <td className="px-5 py-4">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(order.id, e.target.value as OrderStatus)
                      }
                      className="w-52 border border-line bg-white px-3 py-2 text-xs text-charcoal outline-none transition-colors focus:border-gold"
                      aria-label={`Estado de ${order.code}`}
                    >
                      {ORDER_STATUS_ORDER.map((status) => (
                        <option key={status} value={status}>
                          {ORDER_STATUS_META[status].label}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2">
                      <StatusBadge status={order.status} />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
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

      {selectedOrder && (
        <OrderDetailModal
          key={selectedOrder.id}
          orderId={selectedOrder.id}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
