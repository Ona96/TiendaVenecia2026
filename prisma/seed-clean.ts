/**
 * Limpia TODO el contenido de demostración (isDemo = true).
 * No toca datos reales: solo filas marcadas por el seed.
 * Uso: npm run db:seed:clean
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn('[seed-clean] DATABASE_URL no configurada: nada que limpiar.');
    return;
  }

  const deleted = {
    promotions: await prisma.promotion.deleteMany({ where: { isDemo: true } }),
    telasDemo: await prisma.fabric.deleteMany({ where: { isDemo: true } }),
    productos: await prisma.product.deleteMany({ where: { isDemo: true } }),
    colecciones: await prisma.collection.deleteMany({ where: { isDemo: true } }),
    categorias: await prisma.category.deleteMany({ where: { isDemo: true } }),
    cms: await prisma.cmsContent.deleteMany({ where: { isDemo: true } }),
    perfilesDemo: await prisma.profile.deleteMany({ where: { isDemo: true } }),
    ordenesDemo: await prisma.order.deleteMany({ where: { isDemo: true } }),
    presupuestosDemo: await prisma.quote.deleteMany({ where: { isDemo: true } }),
    consultasDemo: await prisma.inquiry.deleteMany({ where: { isDemo: true } }),
    resenasDemo: await prisma.review.deleteMany({ where: { isDemo: true } }),
    pagosDemo: await prisma.payment.deleteMany({ where: { isDemo: true } }),
  };

  console.log('[seed-clean] Contenido demo eliminado:', deleted);
}

main()
  .catch((e) => {
    console.error('[seed-clean] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
