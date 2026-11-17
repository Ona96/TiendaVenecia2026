'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Shirt,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useOrdersStore } from '@/store/orders-store';
import { useCustomersStore } from '@/store/customers-store';
import { useCatalogStore } from '@/store/catalog-store';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ORDER_STATUS_META } from '@/lib/constants';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useMounted } from '@/lib/hooks';
import type { OrderStatus } from '@/lib/types';

const WORKSHOP_STATUSES: OrderStatus[] = [
  'PENDIENTE',
  'EN_CORTE_Y_CONFECION',
  'CONTROL_DE_CALIDAD',
];

export default function AdminDashboardPage() {
  const mounted = useMounted();
  const orders = useOrdersStore((s) => s.orders);
  const customers = useCustomersStore((s) => s.customers);
  const products = useCatalogStore((s) => s.products);

  if (!mounted) {
    return <div className="p-10" />;
  }

  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  const workshopOrders = orders.filter((o) => WORKSHOP_STATUSES.includes(o.status));
  const deliveredOrders = orders.filter((o) => o.status === 'ENTREGADO');
  const published = products.filter((p) => p.status === 'PUBLICADO');
  const lowStock = published.filter((p) => p.stock <= 2);

  // Prendas más vendidas: agregado de items sobre todos los pedidos.
  const salesByProduct = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const current = salesByProduct.get(item.productId) ?? {
        name: item.name,
        quantity: 0,
        revenue: 0,
      };
      current.quantity += item.quantity;
      current.revenue += item.price * item.quantity;
      salesByProduct.set(item.productId, current);
    }
  }
  const topProducts = [...salesByProduct.entries()]
    .map(([productId, stats]) => ({ productId, ...stats }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 4);

  const recentOrders = [...orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const kpis = [
    {
      icon: Wallet,
      label: 'Ingresos totales',
      value: formatCurrency(totalRevenue),
      detail: `${deliveredOrders.length} pedidos entregados`,
    },
    {
      icon: ClipboardList,
      label: 'Pedidos en taller',
      value: String(workshopOrders.length),
      detail: `${orders.length} pedidos históricos`,
    },
    {
      icon: Shirt,
      label: 'Prendas publicadas',
      value: String(published.length),
      detail: `${products.length - published.length} pausadas`,
    },
    {
      icon: Users,
      label: 'Clientas registradas',
      value: String(customers.length),
      detail: 'En la base del atelier',
    },
  ];

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Backoffice</p>
          <h1 className="mt-2 font-display text-3xl text-charcoal">Dashboard del atelier</h1>
          <p className="mt-2 text-sm text-stone-500">
            Panorama del taller: facturación, producción en curso y clientas.
          </p>
        </div>
        <Link
          href="/admin/pedidos"
          className="inline-flex items-center gap-2 bg-charcoal px-6 py-3 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
        >
          Gestionar pedidos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="border border-line bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{kpi.label}</p>
              <kpi.icon className="h-4 w-4 text-gold-dark" />
            </div>
            <p className="mt-3 font-display text-2xl text-charcoal">{kpi.value}</p>
            <p className="mt-1 text-[11px] text-stone-400">{kpi.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Pedidos recientes */}
        <section className="border border-line bg-white">
          <header className="flex items-center justify-between border-b border-line px-6 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-charcoal">Pedidos recientes</p>
            <Link
              href="/admin/pedidos"
              className="text-[11px] uppercase tracking-[0.16em] text-gold-dark transition-colors hover:text-charcoal"
            >
              Ver todos
            </Link>
          </header>
          <ul className="divide-y divide-line">
            {recentOrders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div>
                  <p className="text-sm text-charcoal">{order.code}</p>
                  <p className="text-[11px] text-stone-400">
                    {order.customerName} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-charcoal">{formatCurrency(order.total)}</p>
                  <StatusBadge status={order.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          {/* Más vendidas */}
          <section className="border border-line bg-white">
            <header className="flex items-center gap-2 border-b border-line px-6 py-4">
              <TrendingUp className="h-4 w-4 text-gold-dark" />
              <p className="text-xs uppercase tracking-[0.22em] text-charcoal">Más vendidas</p>
            </header>
            {topProducts.length === 0 ? (
              <p className="px-6 py-6 text-sm text-stone-400">Todavía no hay ventas registradas.</p>
            ) : (
              <ul className="divide-y divide-line">
                {topProducts.map((product) => (
                  <li
                    key={product.productId}
                    className="flex items-center justify-between px-6 py-3.5"
                  >
                    <div>
                      <p className="text-sm text-charcoal">{product.name}</p>
                      <p className="text-[11px] text-stone-400">
                        {product.quantity} {product.quantity === 1 ? 'unidad' : 'unidades'}
                      </p>
                    </div>
                    <p className="text-sm text-gold-dark">{formatCurrency(product.revenue)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Stock bajo */}
          <section className="border border-line bg-white">
            <header className="flex items-center gap-2 border-b border-line px-6 py-4">
              <AlertTriangle className="h-4 w-4 text-gold-dark" />
              <p className="text-xs uppercase tracking-[0.22em] text-charcoal">Cupos críticos</p>
            </header>
            {lowStock.length === 0 ? (
              <p className="px-6 py-6 text-sm text-stone-400">
                Toda la colección tiene cupos de producción cómodos.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {lowStock.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between px-6 py-3.5"
                  >
                    <p className="text-sm text-charcoal">{product.name}</p>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]',
                        product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-gold/15 text-gold-dark',
                      )}
                    >
                      {product.stock === 0 ? 'Agotada' : `${product.stock} cupos`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Estados de taller de referencia */}
      <section className="mt-8 border border-line bg-white p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-charcoal">
          Flujo del taller de referencia
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map((status) => (
            <span
              key={status}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px]',
                ORDER_STATUS_META[status].badge,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', ORDER_STATUS_META[status].dot)} />
              {ORDER_STATUS_META[status].label}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-stone-400">
          Actualizá el estado en la gestión de pedidos y la clienta lo ve al instante en “Mis
          pedidos”.
        </p>
      </section>
    </div>
  );
}
