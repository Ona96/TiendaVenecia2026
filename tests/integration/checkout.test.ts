import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * placeOrder corre con módulos de Next mockeados (fuera del runtime de
 * Next no existen request cookies ni revalidación): la lógica comercial
 * (precios desde la base, stock, reservas, snapshots, totales) es 100%
 * real contra la base de DEV. Compra como invitada.
 */
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => null,
}));

const { placeOrder, releaseExpiredReservations } = await import('@/server/store/checkout');
const { prisma } = await import('@/server/db');

const TEST_EMAIL = 'test-vitest-checkout@verificacion.venecia';

interface Ctx {
  aureliaId: string;
  variantSId: string;
  stockS: number;
  createdOrderIds: string[];
}

beforeAll(async () => {
  const ctx = {} as Ctx;
  const aurelia = await prisma.product.findUnique({
    where: { slug: 'vestido-aurelia' },
    include: { variants: true },
  });
  if (!aurelia) throw new Error('Falta la prenda demo (correr npm run db:seed)');
  const variantS = aurelia.variants.find((v) => v.size === 'S');
  if (!variantS) throw new Error('Falta la variante S demo');

  ctx.aureliaId = aurelia.id;
  ctx.variantSId = variantS.id;
  ctx.stockS = variantS.stock;
  ctx.createdOrderIds = [];
  globalThis.__vitestCheckoutCtx = ctx;
});

afterAll(async () => {
  const ctx = globalThis.__vitestCheckoutCtx as Ctx;
  // Limpieza completa: órdenes de prueba (cascade), reservas y stock.
  await prisma.reservation.deleteMany({ where: { orderId: { in: ctx.createdOrderIds } } });
  await prisma.order.deleteMany({ where: { email: TEST_EMAIL } });
  const variant = await prisma.productVariant.findUnique({ where: { id: ctx.variantSId } });
  if (variant && variant.stock !== ctx.stockS) {
    await prisma.productVariant.update({
      where: { id: ctx.variantSId },
      data: { stock: ctx.stockS },
    });
  }
  await prisma.$disconnect();
});

declare global {
  var __vitestCheckoutCtx: Ctx;
}

const basePayload = {
  name: 'Vitest Compra',
  email: TEST_EMAIL,
  phone: '+54 9 11 5555-5555',
  street: 'Calle Falsa 123',
  city: 'Posadas',
  province: 'Resto del país',
  paymentMethod: 'TRANSFERENCIA' as const,
};

describe('checkout server-side (integración)', () => {
  it('compra válida: precios y totales DESDE LA BASE, stock y snapshots correctos', async () => {
    const ctx = globalThis.__vitestCheckoutCtx as Ctx;
    const result = await placeOrder({
      ...basePayload,
      items: [{ productId: ctx.aureliaId, size: 'S', quantity: 1 }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    ctx.createdOrderIds.push(
      (await prisma.order.findFirstOrThrow({ where: { code: result.code } })).id,
    );

    const order = await prisma.order.findFirstOrThrow({
      where: { code: result.code },
      include: { items: true, payments: true },
    });

    // Precio desde la base, no del navegador: $890.000 = 89000000 c.
    expect(order.totalCents).toBe(89000000);
    expect(order.items[0].unitPriceCents).toBe(89000000);
    // Snapshot del nombre del producto.
    expect(order.items[0].nameSnapshot).toBe('Vestido Aurelia');
    // Estado inicial + pago transferencia PENDIENTE.
    expect(order.status).toBe('PENDIENTE_CONFIRMACION');
    expect(order.payments[0].method).toBe('TRANSFERENCIA');

    // Stock descontado + reserva ACTIVA ligada al pedido.
    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: ctx.variantSId },
    });
    expect(variant.stock).toBe(ctx.stockS - 1);
    const reservations = await prisma.reservation.findMany({
      where: { orderId: order.id },
    });
    expect(reservations).toHaveLength(1);
    expect(reservations[0].status).toBe('ACTIVA');
  });

  it('rechaza comprar más que el stock disponible', async () => {
    const ctx = globalThis.__vitestCheckoutCtx as Ctx;
    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: ctx.variantSId },
    });

    const result = await placeOrder({
      ...basePayload,
      items: [
        {
          productId: ctx.aureliaId,
          size: 'S',
          quantity: Math.min(variant.stock + 2, 5),
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('cupos');
  });

  it('rechaza productos inexistentes o salidos del catálogo', async () => {
    const result = await placeOrder({
      ...basePayload,
      items: [{ productId: 'id-fantasma', size: 'S', quantity: 1 }],
    });
    expect(result.ok).toBe(false);
  });

  it('rechaza cantidad fuera de rango y medidas incompletas (Zod, español)', async () => {
    const ctx = globalThis.__vitestCheckoutCtx as Ctx;

    const cantidad = await placeOrder({
      ...basePayload,
      items: [{ productId: ctx.aureliaId, size: 'S', quantity: 9 }],
    });
    expect(cantidad.ok).toBe(false);
    if (!cantidad.ok) expect(cantidad.error).toMatch(/unidad|Mercado/);

    const medidas = await placeOrder({
      ...basePayload,
      items: [
        {
          productId: ctx.aureliaId,
          size: 'A_MEDIDA',
          quantity: 1,
          measurements: { busto: 88, cintura: 66, cadera: 94, largo: 20 },
        },
      ],
    });
    expect(medidas.ok).toBe(false);
    if (!medidas.ok) expect(medidas.error).toMatch(/rango|medida/i);
  });

  it('la reserva vencida libera el stock (barrido sin cron)', async () => {
    const ctx = globalThis.__vitestCheckoutCtx as Ctx;
    const order = await prisma.order.findFirstOrThrow({
      where: { email: TEST_EMAIL },
      orderBy: { createdAt: 'desc' },
    });

    // Vence la reserva del pedido de prueba y barremos.
    await prisma.reservation.updateMany({
      where: { orderId: order.id, status: 'ACTIVA' },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });
    const released = await releaseExpiredReservations();
    expect(released).toBeGreaterThanOrEqual(1);

    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: ctx.variantSId },
    });
    expect(variant.stock).toBe(ctx.stockS);

    const reservations = await prisma.reservation.findMany({ where: { orderId: order.id } });
    expect(reservations[0].status).toBe('LIBERADA');
  });
});
