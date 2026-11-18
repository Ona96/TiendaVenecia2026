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
import { requireAdmin } from '@/server/admin/guard';
import { getDashboardStats } from '@/server/admin/stats';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { formatCents } from '@/lib/money';
import { formatDate, cn } from '@/lib/utils';
import type { OrderStatus } from '@prisma/client';

/**
 * Dashboard del atelier (Fase 3): métricas REALES de la base,
 * renderizadas en el servidor.
 */
export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const stats = await getDashboardStats();

  const kpis = [
    {
      icon: Wallet,
      label: 'Ingresos totales',
      value: formatCents(stats.revenueCents),
      detail: `${stats.deliveredCount} pedidos entregados`,
    },
    {
      icon: ClipboardList,
      label: 'Pedidos en taller',
      value: String(stats.workshopCount),
      detail: `${stats.ordersCount} pedidos históricos`,
    },
    {
      icon: Shirt,
      label: 'Prendas publicadas',
      value: String(stats.publishedCount),
      detail: `${stats.otherProductsCount} en otros estados`,
    },
    {
      icon: Users,
      label: 'Clientas registradas',
      value: String(stats.customersCount),
      detail: 'En la base del atelier',
    },
  ];

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Backoffice</p>
          <h1 className="mt-2 font-display text-3xl text-charcoal">Hola, {admin.name}</h1>
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
          {stats.recentOrders.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-stone-400">
              Todavía no hay pedidos. Cuando la boutique venda, los vas a ver acá.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                >
                  <div>
                    <p className="text-sm text-charcoal">{order.code}</p>
                    <p className="text-[11px] text-stone-400">
                      {order.clienta} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-charcoal">{formatCents(order.totalCents)}</p>
                    <AdminStatusBadge status={order.status as OrderStatus} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          {/* Más vendidas */}
          <section className="border border-line bg-white">
            <header className="flex items-center gap-2 border-b border-line px-6 py-4">
              <TrendingUp className="h-4 w-4 text-gold-dark" />
              <p className="text-xs uppercase tracking-[0.22em] text-charcoal">Más vendidas</p>
            </header>
            {stats.topProducts.length === 0 ? (
              <p className="px-6 py-6 text-sm text-stone-400">Todavía no hay ventas registradas.</p>
            ) : (
              <ul className="divide-y divide-line">
                {stats.topProducts.map((product) => (
                  <li key={product.id} className="flex items-center justify-between px-6 py-3.5">
                    <div>
                      <p className="text-sm text-charcoal">{product.name}</p>
                      <p className="text-[11px] text-stone-400">
                        {product.quantity} {product.quantity === 1 ? 'unidad' : 'unidades'}
                      </p>
                    </div>
                    <p className="text-sm text-gold-dark">{formatCents(product.revenueCents)}</p>
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
            {stats.lowStock.length === 0 ? (
              <p className="px-6 py-6 text-sm text-stone-400">
                Toda la colección tiene cupos de producción cómodos.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {stats.lowStock.map((product) => (
                  <li key={product.id} className="flex items-center justify-between px-6 py-3.5">
                    <p className="text-sm text-charcoal">{product.name}</p>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]',
                        product.stock === 0
                          ? 'bg-error-soft text-error'
                          : 'bg-warn-soft text-warn',
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
    </div>
  );
}
