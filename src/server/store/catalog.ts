import { prisma } from '@/server/db';
import type { Product } from '@/lib/types';

/**
 * Catálogo público del storefront (server).
 *
 * Mapper DB → Product (la forma que ya consumen ProductCard, filtros,
 * ficha y carrito). El precio viaja en ARS legibles para mostrar/ordenar,
 * pero el checkout recalcula TODO en centavos desde la base: el número
 * del cliente es solo informativo.
 */

const CATEGORY_SLUG_TO_ENUM: Record<string, Product['category']> = {
  novia: 'NOVIA',
  fiesta: 'FIESTA',
  coctel: 'COCTEL',
  gala: 'GALA',
  civil: 'CIVIL',
  quince: 'QUINCE',
};

function toStoreProduct(row: {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  fabrics: string[];
  occasions: string[];
  productionHours: number;
  featured: boolean;
  createdAt: Date;
  status: string;
  category: { slug: string };
  images: { url: string; position: number }[];
  variants: { size: string; stock: number }[];
}): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: row.priceCents / 100,
    category: CATEGORY_SLUG_TO_ENUM[row.category.slug] ?? 'FIESTA',
    fabrics: row.fabrics,
    occasions: row.occasions,
    sizes: row.variants.map((v) => v.size),
    stock: row.variants.reduce((acc, v) => acc + v.stock, 0),
    productionHours: row.productionHours,
    images: [...row.images]
      .sort((a, b) => a.position - b.position)
      .map((i) => i.url),
    featured: row.featured,
    status: row.status as Product['status'],
    createdAt: row.createdAt.toISOString(),
  };
}

/** Catálogo publicado para /coleccion y home. */
export async function getPublishedProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { status: 'PUBLICADO' },
    include: { category: true, images: true, variants: true },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(toStoreProduct);
}

/** Ficha de producto por slug (solo PUBLICADO; PAUSADO/ARCHIVADO = 404). */
export async function getPublishedProductBySlug(slug: string): Promise<Product | null> {
  const row = await prisma.product.findFirst({
    where: { slug, status: 'PUBLICADO' },
    include: { category: true, images: true, variants: true },
  });
  return row ? toStoreProduct(row) : null;
}

/** Destacadas para la home. */
export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { status: 'PUBLICADO', featured: true },
    include: { category: true, images: true, variants: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
  return rows.map(toStoreProduct);
}
