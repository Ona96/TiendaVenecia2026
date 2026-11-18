import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/server/db';
import { processMercadoPagoPayment } from '@/server/store/payments';
import type { MpPayment } from '@/server/integrations/mercadopago';

/**
 * Idempotencia del webhook de Mercado Pago (criterio de aceptación Fase 6).
 * Corre contra la base de DEV con datos de prueba que se limpian solos:
 *   - webhook duplicado NO duplica cobro ni decremento de stock
 *   - pago pending NO marca "pagado"
 */

const TEST_EMAIL = 'test-vitest@verificacion.venecia';

let orderId: string;
let paymentId: string;
let variantId: string;
let stockOriginal: number;

beforeAll(async () => {
  const aurelia = await prisma.product.findUnique({
    where: { slug: 'vestido-aurelia' },
    include: { variants: true },
  });
  if (!aurelia) throw new Error('Falta la prenda demo (correr npm run db:seed)');
  const variantS = aurelia.variants.find((v) => v.size === 'S');
  if (!variantS) throw new Error('Falta la variante S demo');

  variantId = variantS.id;
  stockOriginal = variantS.stock;

  // Estado post-checkout simulado: orden + pago MP PENDIENTE + reserva
  // ACTIVA ligada + stock ya descontado (exactamente lo que hace placeOrder).
  const created = await prisma.order.create({
    data: {
      code: `VIT-${Date.now()}`,
      email: TEST_EMAIL,
      status: 'PENDIENTE_CONFIRMACION',
      paymentStatus: 'PENDIENTE',
      shippingMethod: 'ENVIO',
      shippingStatus: 'A_COTIZAR',
      subtotalCents: aurelia.priceCents,
      totalCents: aurelia.priceCents,
      shipName: 'Vitest',
      shipPhone: '+549115555555',
      shipStreet: 'Test',
      shipCity: 'Posadas',
      shipProvince: 'Resto del país',
      workshopNotes: 'VITEST — se elimina',
      items: {
        create: [
          {
            productId: aurelia.id,
            nameSnapshot: aurelia.name,
            size: 'S',
            quantity: 1,
            unitPriceCents: aurelia.priceCents,
          },
        ],
      },
    },
  });
  orderId = created.id;

  const payment = await prisma.payment.create({
    data: {
      orderId,
      method: 'MERCADO_PAGO',
      status: 'PENDIENTE',
      amountCents: aurelia.priceCents,
    },
  });
  paymentId = payment.id;

  await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock: { decrement: 1 } },
  });
  await prisma.reservation.create({
    data: {
      variantId,
      orderId,
      quantity: 1,
      status: 'ACTIVA',
      expiresAt: new Date(Date.now() + 30 * 60_000),
    },
  });
});

afterAll(async () => {
  // Limpieza total: orden (cascade items/pagos/historial), reservas,
  // stock restaurado.
  await prisma.order.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.reservation.deleteMany({ where: { orderId } });
  await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock: stockOriginal },
  });
  await prisma.$disconnect();
});

const mpApproved: MpPayment = {
  id: 1122334455,
  status: 'approved',
  external_reference: '', // se completa en cada test
  transaction_amount: 890000,
  status_detail: 'accredited',
};

describe('webhook MP idempotente (integración)', () => {
  it('primer webhook aprobado: verifica pago y consume reserva', async () => {
    const result = await processMercadoPagoPayment({
      ...mpApproved,
      external_reference: paymentId,
    });
    expect(result.ok).toBe(true);
    expect(result.duplicate).toBeUndefined();

    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    expect(payment.status).toBe('VERIFICADO');
    expect(payment.mpPaymentId).toBe('1122334455');
    expect(payment.verifiedAt).not.toBeNull();

    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.paymentStatus).toBe('VERIFICADO');

    const reservations = await prisma.reservation.findMany({ where: { orderId } });
    expect(reservations).toHaveLength(1);
    expect(reservations[0].status).toBe('CONSUMIDA');

    // El stock se descuenta UNA vez (en el checkout), no por el webhook.
    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(variant.stock).toBe(stockOriginal - 1);
  });

  it('webhook DUPLICADO: no-op total (ni cobro ni stock ni fechas)', async () => {
    const verifiedBefore = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const variantBefore = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });

    const result = await processMercadoPagoPayment({
      ...mpApproved,
      external_reference: paymentId,
    });
    expect(result.ok).toBe(true);
    expect(result.duplicate).toBe(true);

    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    expect(payment.verifiedAt?.toISOString()).toBe(verifiedBefore.verifiedAt?.toISOString());

    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(variant.stock).toBe(variantBefore.stock);

    // Sin pagos duplicados en la base.
    const total = await prisma.payment.count({ where: { orderId } });
    expect(total).toBe(1);
  });

  it('pago pending de MP: registrado pero NUNCA marca pagado', async () => {
    // Fila nueva para el caso pending.
    const pendingPayment = await prisma.payment.create({
      data: {
        orderId,
        method: 'MERCADO_PAGO',
        status: 'PENDIENTE',
        amountCents: 100000,
      },
    });

    const result = await processMercadoPagoPayment({
      id: 9988776655,
      status: 'pending',
      external_reference: pendingPayment.id,
      transaction_amount: 1000,
    });
    expect(result.ok).toBe(true);
    // El detalle reporta "registrado"; la NOTA del pago documenta que no
    // hubo transición (comprobante ≠ pagado).
    const paymentRow = await prisma.payment.findUniqueOrThrow({
      where: { id: pendingPayment.id },
    });
    expect(paymentRow.note).toContain('sin transición');
    expect(paymentRow.status).toBe('PENDIENTE');
    expect(paymentRow.verifiedAt).toBeNull();
    expect(paymentRow.mpPaymentId).toBe('9988776655');
  });
});
