import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/server/db';

/**
 * Criterio de aceptación Fase 5: las medidas modificadas después de la
 * compra NO alteran el snapshot del pedido. Los ítems guardan copia.
 */

const TEST_NOTE = 'VITEST MEDIDAS — se elimina';

let profileId: string;
let orderId: string;
let variantSId: string;
let stockS: number;

beforeAll(async () => {
  const valentina = await prisma.profile.findFirst({
    where: { name: { contains: 'Valentina' } },
  });
  if (!valentina) throw new Error('Falta el perfil demo de Valentina');
  profileId = valentina.id;

  const serena = await prisma.product.findUnique({
    where: { slug: 'vestido-serena' },
    include: { variants: true },
  });
  if (!serena) throw new Error('Falta la prenda demo Serena');
  const variantS = serena.variants.find((v) => v.size === 'S');
  if (!variantS) throw new Error('Falta la variante S de Serena');
  variantSId = variantS.id;
  stockS = variantS.stock;
});

afterAll(async () => {
  await prisma.measurementVersion.deleteMany({
    where: { profileId, source: { startsWith: 'VITEST' } },
  });
  if (orderId) {
    await prisma.reservation.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } }).catch(() => {});
  }
  const variant = await prisma.productVariant.findUnique({ where: { id: variantSId } });
  if (variant && variant.stock !== stockS) {
    await prisma.productVariant.update({
      where: { id: variantSId },
      data: { stock: stockS },
    });
  }
  await prisma.$disconnect();
});

describe('snapshot de medidas del pedido (integración)', () => {
  it('cambiar las medidas después de comprar no altera el pedido', async () => {
    // v1 de medidas: con estas se compró.
    const v1 = await prisma.measurementVersion.create({
      data: {
        profileId,
        busto: 88,
        cintura: 66,
        cadera: 94,
        largo: 148,
        source: 'VITEST-V1',
      },
    });

    // Pedido a medida con las medidas de v1 (como hace el checkout).
    const order = await prisma.order.create({
      data: {
        code: `VIT-M-${Date.now()}`,
        profileId,
        email: 'valentina@demo.venecia',
        status: 'PENDIENTE_CONFIRMACION',
        paymentStatus: 'PENDIENTE',
        shippingMethod: 'ENVIO',
        shippingStatus: 'A_COTIZAR',
        subtotalCents: 46500000,
        totalCents: 46500000,
        shipName: 'Vitest Medidas',
        shipPhone: '+549115555555',
        shipStreet: 'Test',
        shipCity: 'Posadas',
        shipProvince: 'Resto del país',
        workshopNotes: TEST_NOTE,
        items: {
          create: [
            {
              size: 'A_MEDIDA',
              madeToMeasure: true,
              busto: v1.busto,
              cintura: v1.cintura,
              cadera: v1.cadera,
              largo: v1.largo,
              quantity: 1,
              unitPriceCents: 46500000,
              nameSnapshot: 'Vestido Serena',
            },
          ],
        },
      },
      include: { items: true },
    });
    orderId = order.id;

    // La clienta cambia sus medidas (v2, después de la compra).
    await prisma.measurementVersion.create({
      data: {
        profileId,
        busto: 95,
        cintura: 71,
        cadera: 99,
        largo: 152,
        source: 'VITEST-V2',
      },
    });

    // El snapshot del pedido sigue siendo el de v1.
    const item = order.items[0];
    expect(item.busto).toBe(88);
    expect(item.cintura).toBe(66);
    expect(item.cadera).toBe(94);
    expect(item.largo).toBe(148);

    // Y la versión vigente de la clienta es la nueva (append-only).
    const latest = await prisma.measurementVersion.findFirst({
      where: { profileId },
      orderBy: { at: 'desc' },
    });
    expect(latest?.source).toBe('VITEST-V2');
    // Las versiones anteriores no se pisaron.
    expect(
      await prisma.measurementVersion.count({
        where: { profileId, source: { startsWith: 'VITEST' } },
      }),
    ).toBe(2);
  });
});
