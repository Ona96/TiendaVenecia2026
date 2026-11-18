import { prisma } from '@/server/db';
import { ORDER_IN_PROGRESS } from '@/domain/state-machines';

/**
 * Agregados del dashboard (server). Todo en centavos; el CANCELADO
 * nunca suma a ingresos.
 */

export interface AdminDashboardStats {
  revenueCents: number;
  workshopCount: number;
  deliveredCount: number;
  ordersCount: number;
  publishedCount: number;
  otherProductsCount: number;
  customersCount: number;
  recentOrders: {
    id: string;
    code: string;
    clienta: string;
    totalCents: number;
    status: string;
    createdAt: string;
  }[];
  topProducts: { id: string; name: string; quantity: number; revenueCents: number }[];
  lowStock: { id: string; name: string; stock: number }[];
}

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const [orders, products, customersCount] = await Promise.all([
    prisma.order.findMany({
      select: {
        id: true,
        code: true,
        shipName: true,
        totalCents: true,
        status: true,
        createdAt: true,
        items: { select: { productId: true, nameSnapshot: true, quantity: true, unitPriceCents: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      where: { status: { not: 'ARCHIVADO' } },
      select: {
        id: true,
        name: true,
        status: true,
        variants: { select: { stock: true } },
      },
    }),
    prisma.profile.count({ where: { role: 'CLIENTE' } }),
  ]);

  const revenueCents = orders
    .filter((o) => o.status !== 'CANCELADO')
    .reduce((acc, o) => acc + o.totalCents, 0);
  const workshopCount = orders.filter((o) =>
    (ORDER_IN_PROGRESS as string[]).includes(o.status),
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'ENTREGADO').length;

  // Más vendidas por snapshot de nombre (sobrevive al archivo del producto).
  const salesByProduct = new Map<string, { name: string; quantity: number; revenueCents: number }>();
  for (const order of orders) {
    if (order.status === 'CANCELADO') continue;
    for (const item of order.items) {
      const key = item.productId ?? `snapshot:${item.nameSnapshot}`;
      const current = salesByProduct.get(key) ?? {
        name: item.nameSnapshot,
        quantity: 0,
        revenueCents: 0,
      };
      current.quantity += item.quantity;
      current.revenueCents += item.unitPriceCents * item.quantity;
      salesByProduct.set(key, current);
    }
  }
  const topProducts = [...salesByProduct.entries()]
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 4);

  const published = products.filter((p) => p.status === 'PUBLICADO');
  const lowStock = published
    .map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.variants.reduce((acc, v) => acc + v.stock, 0),
    }))
    .filter((p) => p.stock <= 2)
    .sort((a, b) => a.stock - b.stock);

  return {
    revenueCents,
    workshopCount,
    deliveredCount,
    ordersCount: orders.length,
    publishedCount: published.length,
    otherProductsCount: products.length - published.length,
    customersCount,
    recentOrders: orders.slice(0, 5).map((o) => ({
      id: o.id,
      code: o.code,
      clienta: o.shipName,
      totalCents: o.totalCents,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
    topProducts,
    lowStock,
  };
}
