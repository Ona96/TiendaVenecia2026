'use client';

import { useMemo, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { useCustomersStore } from '@/store/customers-store';
import { useOrdersStore } from '@/store/orders-store';
import { CustomerDetailModal } from '@/components/admin/CustomerDetailModal';
import { measurementsSummary } from '@/components/store/MeasurementsForm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useMounted } from '@/lib/hooks';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminClientesPage() {
  const mounted = useMounted();
  const customers = useCustomersStore((s) => s.customers);
  const orders = useOrdersStore((s) => s.orders);

  const [query, setQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return customers
      .map((customer) => {
        const customerOrders = orders.filter(
          (o) => o.customerEmail.toLowerCase() === customer.email.toLowerCase(),
        );
        const totalSpent = customerOrders.reduce((acc, o) => acc + o.total, 0);
        const lastOrderAt = customerOrders.reduce<string | null>((latest, o) => {
          return !latest || o.createdAt > latest ? o.createdAt : latest;
        }, null);
        return { customer, ordersCount: customerOrders.length, totalSpent, lastOrderAt };
      })
      .filter(({ customer }) => {
        if (!normalized) return true;
        const haystack = `${customer.name} ${customer.email} ${customer.city}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, orders, query]);

  if (!mounted) {
    return (
      <div className="p-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      <div>
        <p className="eyebrow">Gestión</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Clientas del atelier</h1>
        <p className="mt-2 text-sm text-stone-500">
          {rows.length} clientas · ordenadas por total gastado
        </p>
      </div>

      <div className="mt-8">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, email o ciudad…"
            className="field pl-10"
          />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-stone-400">
              <th className="px-5 py-3.5 font-medium">Clienta</th>
              <th className="px-5 py-3.5 font-medium">Contacto</th>
              <th className="px-5 py-3.5 font-medium">Medidas</th>
              <th className="px-5 py-3.5 font-medium">Pedidos</th>
              <th className="px-5 py-3.5 font-medium">Total gastado</th>
              <th className="px-5 py-3.5 font-medium">Última compra</th>
              <th className="px-5 py-3.5 font-medium">Ficha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-stone-400">
                  No hay clientas que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              rows.map(({ customer, ordersCount, totalSpent, lastOrderAt }) => (
                <tr key={customer.id} className="transition-colors hover:bg-gold/5">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/60 bg-gold/10 text-sm font-medium text-gold-dark">
                        {customer.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-charcoal">{customer.name}</p>
                        <p className="text-[11px] text-stone-400">
                          {customer.city || '—'} · desde {formatDate(customer.registeredAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-charcoal">{customer.email}</p>
                    <p className="text-[11px] text-stone-400">{customer.phone || '—'}</p>
                  </td>
                  <td className="px-5 py-4">
                    {customer.savedMeasurements ? (
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-gold/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-gold-dark">
                          {measurementsSummary(customer.savedMeasurements)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-stone-400">Sin medidas</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-charcoal">{ordersCount}</td>
                  <td className="px-5 py-4 text-charcoal">{formatCurrency(totalSpent)}</td>
                  <td className="px-5 py-4 text-stone-500">
                    {lastOrderAt ? formatDate(lastOrderAt) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-gold-dark transition-colors hover:text-charcoal"
                    >
                      <Eye className="h-4 w-4" />
                      Ver ficha
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCustomerId && (
        <CustomerDetailModal
          key={selectedCustomerId}
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
}
