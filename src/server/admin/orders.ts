import { prisma } from '@/server/db';

/**
 * Datos de pedidos para el panel (server). Snapshots inmutables:
 * el ítem guarda nombre/imagen aunque el producto se archive.
 */

export interface AdminOrderItemView {
  id: string;
  name: string;
  image: string | null;
  size: string;
  madeToMeasure: boolean;
  quantity: number;
  unitPriceCents: number;
}

export interface AdminOrderHistoryView {
  id: string;
  from: string | null;
  to: string;
  at: string;
  byName: string | null;
  note: string | null;
}

export interface AdminOrderView {
  id: string;
  code: string;
  profileId: string | null;
  email: string;
  shipName: string;
  shipPhone: string;
  shipStreet: string;
  shipCity: string;
  shipProvince: string;
  workshopNotes: string | null;
  status: string;
  paymentStatus: string;
  shippingStatus: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItemView[];
  history: AdminOrderHistoryView[];
  payments: {
    id: string;
    method: string;
    status: string;
    amountCents: number;
    evidenceUrl: string | null;
    declaredAt: string | null;
    verifiedAt: string | null;
  }[];
}

export async function getAdminOrders(): Promise<AdminOrderView[]> {
  const orders = await prisma.order.findMany({
    include: {
      items: true,
      history: { orderBy: { at: 'asc' } },
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map((o) => ({
    id: o.id,
    code: o.code,
    profileId: o.profileId,
    email: o.email,
    shipName: o.shipName,
    shipPhone: o.shipPhone,
    shipStreet: o.shipStreet,
    shipCity: o.shipCity,
    shipProvince: o.shipProvince,
    workshopNotes: o.workshopNotes,
    status: o.status,
    paymentStatus: o.paymentStatus,
    shippingStatus: o.shippingStatus,
    subtotalCents: o.subtotalCents,
    discountCents: o.discountCents,
    shippingCents: o.shippingCents,
    totalCents: o.totalCents,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      name: i.nameSnapshot,
      image: i.imageSnapshot,
      size: i.size,
      madeToMeasure: i.madeToMeasure,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
    })),
    history: o.history.map((h) => ({
      id: h.id,
      from: h.from,
      to: h.to,
      at: h.at.toISOString(),
      byName: h.byProfileId,
      note: h.note,
    })),
    payments: o.payments.map((p) => ({
      id: p.id,
      method: p.method,
      status: p.status,
      amountCents: p.amountCents,
      evidenceUrl: p.evidenceUrl,
      declaredAt: p.declaredAt?.toISOString() ?? null,
      verifiedAt: p.verifiedAt?.toISOString() ?? null,
    })),
  }));
}
