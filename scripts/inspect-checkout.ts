/**
 * Inspección post-test del flujo de checkout (Fase 4).
 * Uso: npx tsx scripts/inspect-checkout.ts [expirar]
 *  - sin args: muestra orden de prueba, ítems, pago, reserva y stock
 *  - "expirar": vence la reserva ACTIVA (para probar el barrido)
 *  - "limpiar": borra la orden de prueba y normaliza el stock
 */
import { prisma } from '../src/server/db';

const mode = process.argv[2] ?? '';

async function main() {
  if (mode === 'expirar') {
    const updated = await prisma.reservation.updateMany({
      where: { status: 'ACTIVA', orderId: null },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });
    console.log(`⏰ Reservas vencidas manualmente: ${updated.count}`);
    await prisma.$disconnect();
    return;
  }

  if (mode === 'limpiar') {
    const orders = await prisma.order.findMany({
      where: { email: 'test@verificacion.venecia' },
      select: { id: true },
    });
    for (const o of orders) {
      // Cascade limpia items/history/payments; reservas no tienen FK a order
      // en el caso de prueba (orderId null): se liberan aparte.
      await prisma.reservation.deleteMany({ where: { status: 'LIBERADA' } });
      await prisma.order.delete({ where: { id: o.id } });
      console.log(`🧹 Orden de prueba eliminada: ${o.id}`);
    }
    // Stock vuelve al valor del seed (aurelia S = 2).
    const aurelia = await prisma.product.findUnique({
      where: { slug: 'vestido-aurelia' },
      include: { variants: true },
    });
    if (aurelia) {
      for (const v of aurelia.variants) {
        const target = { XS: 1, S: 2, M: 1 }[v.size] ?? v.stock;
        if (v.stock !== target) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: { stock: target },
          });
          console.log(`🧹 Stock ${v.size}: ${v.stock} → ${target}`);
        }
      }
    }
    await prisma.$disconnect();
    return;
  }

  const order = await prisma.order.findFirst({
    where: { email: 'test@verificacion.venecia' },
    include: {
      items: true,
      payments: true,
      history: { orderBy: { at: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!order) {
    console.log('❌ No hay orden de prueba.');
    process.exit(1);
  }

  console.log(`Orden ${order.code} — estado ${order.status}, pago ${order.paymentStatus}`);
  console.log(
    `Totales (centavos): subtotal ${order.subtotalCents} + envío ${order.shippingCents} = ${order.totalCents}`,
  );
  console.log(`Envío: ${order.shipName} · ${order.shipStreet}, ${order.shipCity}, ${order.shipProvince}`);
  for (const item of order.items) {
    console.log(
      `Ítem: ${item.nameSnapshot} · talle ${item.size} · x${item.quantity} · ${item.unitPriceCents} c/u`,
    );
  }
  for (const p of order.payments) {
    console.log(`Pago: ${p.method} · ${p.status} · ${p.amountCents} centavos`);
  }
  console.log(`Historial: ${order.history.map((h) => h.to).join(' → ')}`);

  const reservations = await prisma.reservation.findMany({ include: { variant: true } });
  for (const r of reservations) {
    console.log(
      `Reserva: ${r.status} · ${r.variantId ? 'variante ' + r.variantId.slice(0, 8) : '?'} · qty ${r.quantity} · vence ${r.expiresAt.toISOString()}`,
    );
  }

  const aurelia = await prisma.product.findUnique({
    where: { slug: 'vestido-aurelia' },
    include: { variants: true },
  });
  if (aurelia) {
    console.log('Stock Aurelia post-compra (seed: XS 1, S 2, M 1):');
    aurelia.variants.forEach((v) => console.log(`   · ${v.size}: ${v.stock}`));
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
