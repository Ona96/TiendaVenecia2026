/**
 * Venecia — Seed de DEMOSTRACIÓN
 * ------------------------------------------------------------
 * Reglas (prompt maestro §8):
 * - Todo dato creado acá lleva isDemo: true y es idempotente
 *   (se puede correr N veces sin duplicar).
 * - Es contenido de PRUEBA claramente etiquetado: nunca debe
 *   exponerse como real en producción.
 * - Limpieza total: npm run db:seed:clean
 * - Se salta automáticamente si no hay DATABASE_URL configurada.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const img = (slug: string, n: number) => `/images/products/${slug}-${n}.jpg`;

const DEMO = true;

interface SeedProduct {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  categorySlug: string;
  fabrics: string[];
  occasions: string[];
  sizes: { size: string; stock: number }[];
  productionHours: number;
  featured: boolean;
  collections: string[];
  madeToOrder: boolean;
}

type CmsValue = Record<string, string | number | boolean>;

const categories = [
  { slug: 'novia', name: 'Novia', sortOrder: 1 },
  { slug: 'fiesta', name: 'Fiesta', sortOrder: 2 },
  { slug: 'coctel', name: 'Cóctel', sortOrder: 3 },
  { slug: 'gala', name: 'Gala', sortOrder: 4 },
  { slug: 'civil', name: 'Civil', sortOrder: 5 },
  { slug: 'quince', name: 'Quinceañera', sortOrder: 6 },
];

const collections = [
  {
    slug: 'ceremonia-2026',
    name: 'Ceremonia 2026',
    description: 'Selección editorial de la temporada de ceremonias.',
    featured: true,
  },
  {
    slug: 'noche-larga',
    name: 'Noche Larga',
    description: 'Gala y fiesta de evening wear con bordados a mano.',
    featured: true,
  },
  {
    slug: 'civil-minimal',
    name: 'Civil Minimal',
    description: 'Líneas puras para casamientos civiles de día.',
    featured: false,
  },
];

const products: SeedProduct[] = [
  {
    slug: 'vestido-aurelia',
    name: 'Vestido Aurelia',
    description:
      'Escote recto y espalda abierta en seda mikado. Cada costura se refuerza a mano con puntada invisible.',
    priceCents: 89000000,
    categorySlug: 'novia',
    fabrics: ['Seda mikado'],
    occasions: ['Casamiento', 'Civil'],
    sizes: [
      { size: 'XS', stock: 1 },
      { size: 'S', stock: 2 },
      { size: 'M', stock: 1 },
    ],
    productionHours: 120,
    featured: true,
    collections: ['ceremonia-2026'],
    madeToOrder: true,
  },
  {
    slug: 'vestido-serena',
    name: 'Vestido Serena',
    description:
      'Línea siraca con drapeado lateral en satén duchesse y bordado a mano en la cintura con hilo dorado mate.',
    priceCents: 46500000,
    categorySlug: 'fiesta',
    fabrics: ['Satén duchesse'],
    occasions: ['Fiesta', 'Graduación'],
    sizes: [
      { size: 'XS', stock: 2 },
      { size: 'S', stock: 2 },
      { size: 'M', stock: 1 },
      { size: 'L', stock: 1 },
    ],
    productionHours: 70,
    featured: true,
    collections: ['noche-larga'],
    madeToOrder: true,
  },
];

const cmsEntries: { key: string; value: CmsValue }[] = [
  {
    key: 'home.hero',
    value: {
      eyebrow: 'Alta Costura · Misiones, Argentina',
      title: 'Vestidos que se cosen a mano, uno por uno.',
      subtitle:
        'Atelier boutique de confección por encargo. Telas de seda, encaje francés y acabados que solo sobreviven en la costura manual.',
      ctaPrimary: 'Explorar la colección',
      ctaSecondary: 'Conocer el proceso',
    },
  },
  {
    key: 'shop.contact',
    value: {
      email: 'hola@venecia.com.ar',
      city: 'Posadas, Misiones',
      hours: 'Lun a Vie · 10 a 19 h',
      whatsapp: '',
    },
  },
  {
    key: 'shipping.policy',
    value: {
      // $ 150.000 ARS en centavos. Administrable desde el panel.
      freeShippingThresholdCents: 15000000,
      // Cotización manual inicial: el admin define el costo por pedido.
      manualQuoteMode: true,
      // Retiro en boutique siempre sin cargo.
      pickupFree: true,
    },
  },
  {
    key: 'transfers.policy',
    value: {
      // Plazo configurable para acreditación de transferencias (horas).
      verificationWindowHours: 48,
      cbu: '',
      alias: '',
      accountHolder: '',
    },
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn(
      '[seed] DATABASE_URL no está configurada: no hay base de datos conectada. Nada que hacer (ver docs/FASE-1.md).',
    );
    return;
  }

  console.log('[seed] Cargando contenido de DEMOSTRACIÓN (etiquetado isDemo=true)…');

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: category.sortOrder, isDemo: DEMO },
      create: { ...category, isDemo: DEMO },
    });
  }

  for (const collection of collections) {
    await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: { ...collection, isDemo: DEMO },
      create: { ...collection, isDemo: DEMO },
    });
  }

  for (const entry of cmsEntries) {
    await prisma.cmsContent.upsert({
      where: { key: entry.key },
      update: { value: entry.value, isDemo: DEMO },
      create: { key: entry.key, value: entry.value, isDemo: DEMO },
    });
  }

  for (const p of products) {
    const category = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
    if (!category) throw new Error(`Categoría inexistente: ${p.categorySlug}`);

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        categoryId: category.id,
        fabrics: p.fabrics,
        occasions: p.occasions,
        productionHours: p.productionHours,
        featured: p.featured,
        madeToOrder: p.madeToOrder,
        madeToMeasure: true,
        sellable: true,
        isDemo: DEMO,
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        categoryId: category.id,
        fabrics: p.fabrics,
        occasions: p.occasions,
        productionHours: p.productionHours,
        featured: p.featured,
        madeToOrder: p.madeToOrder,
        madeToMeasure: true,
        sellable: true,
        isDemo: DEMO,
      },
    });

    for (let i = 1; i <= 1; i++) {
      const url = img(p.slug, i);
      const existing = await prisma.productImage.findFirst({
        where: { productId: product.id, url },
      });
      if (!existing) {
        await prisma.productImage.create({
          data: { productId: product.id, url, alt: `${p.name} — vista ${i}`, position: i },
        });
      }
    }

    for (const variant of p.sizes) {
      await prisma.productVariant.upsert({
        where: { productId_size: { productId: product.id, size: variant.size } },
        update: { stock: variant.stock },
        create: { productId: product.id, size: variant.size, stock: variant.stock },
      });
    }

    for (const collectionSlug of p.collections) {
      const collection = await prisma.collection.findUnique({ where: { slug: collectionSlug } });
      if (!collection) throw new Error(`Colección inexistente: ${collectionSlug}`);
      await prisma.productCollection.upsert({
        where: {
          productId_collectionId: { productId: product.id, collectionId: collection.id },
        },
        update: {},
        create: { productId: product.id, collectionId: collection.id },
      });
    }
  }

  // Promoción demo (vigencia claramente marcada).
  const promoEnd = new Date();
  promoEnd.setDate(promoEnd.getDate() + 30);
  const serena = await prisma.product.findUnique({ where: { slug: 'vestido-serena' } });
  if (serena) {
    await prisma.promotion.upsert({
      where: { id: 'demo-promo-serena' },
      update: { endsAt: promoEnd, active: true, isDemo: DEMO },
      create: {
        id: 'demo-promo-serena',
        name: 'DEMO — Temporada Fiesta 10% off',
        type: 'PORCENTAJE',
        value: 10,
        startsAt: new Date(),
        endsAt: promoEnd,
        active: true,
        isDemo: DEMO,
        products: { create: [{ productId: serena.id }] },
      },
    });
  }

  const counts = {
    categorias: await prisma.category.count(),
    colecciones: await prisma.collection.count(),
    productos: await prisma.product.count(),
    variantes: await prisma.productVariant.count(),
    cms: await prisma.cmsContent.count(),
  };
  console.log('[seed] Contenido demo cargado:', counts);
  console.log(
    '[seed] Usuarios de auth y pedidos demo: se cargan en la Fase 1b, cuando exista el proyecto Supabase (no se inventan credenciales).',
  );
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
