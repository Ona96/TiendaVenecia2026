import { prisma } from '@/server/db';

/**
 * Clientas del atelier (server). Los perfiles viven en `public.profiles`
 * (unidos 1:1 con auth.users); el email se lee de auth.users por SQL crudo
 * porque no se replica (decisión de diseño del schema).
 */

export interface AdminCustomerView {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  role: string;
  createdAt: string;
  measurements: { busto: number; cintura: number; cadera: number; largo: number } | null;
  ordersCount: number;
  totalSpentCents: number;
  lastOrderAt: string | null;
}

export async function getAdminCustomers(): Promise<AdminCustomerView[]> {
  // Email y rol desde el auth (lectura directa, sin exponer nada al cliente).
  const authRows = await prisma.$queryRawUnsafe<{ id: string; email: string }[]>(
    'select id, email from auth.users',
  );
  const emailById = new Map(authRows.map((r) => [r.id, r.email]));

  const profiles = await prisma.profile.findMany({
    include: {
      measurements: { orderBy: { at: 'desc' }, take: 1 },
      addresses: { where: { isDefault: true }, take: 1 },
      orders: { select: { totalCents: true, createdAt: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return profiles
    .map((p) => {
      const ordersCount = p.orders.length;
      const totalSpentCents = p.orders.reduce((acc, o) => acc + o.totalCents, 0);
      const lastOrderAt = p.orders.reduce<string | null>((latest, o) => {
        const iso = o.createdAt.toISOString();
        return !latest || iso > latest ? iso : latest;
      }, null);

      return {
        id: p.id,
        name: p.name,
        email: emailById.get(p.id) ?? null,
        phone: p.phone,
        city: p.addresses[0]?.city ?? null,
        role: p.role,
        createdAt: p.createdAt.toISOString(),
        measurements: p.measurements[0]
          ? {
              busto: p.measurements[0].busto,
              cintura: p.measurements[0].cintura,
              cadera: p.measurements[0].cadera,
              largo: p.measurements[0].largo,
            }
          : null,
        ordersCount,
        totalSpentCents,
        lastOrderAt,
      };
    })
    .sort((a, b) => b.totalSpentCents - a.totalSpentCents);
}
