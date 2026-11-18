import { prisma } from '@/server/db';

/**
 * Datos de prendas para el panel (server).
 * El dinero viaja en centavos enteros y se formatea al mostrar.
 */

export interface AdminProductView {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  categorySlug: string;
  categoryName: string;
  fabrics: string[];
  occasions: string[];
  sizes: string[];
  stock: number;
  productionHours: number;
  images: string[];
  featured: boolean;
  status: 'PUBLICADO' | 'PAUSADO' | 'ARCHIVADO';
  isDemo: boolean;
}

export async function getAdminProducts(): Promise<AdminProductView[]> {
  const products = await prisma.product.findMany({
    // ARCHIVADO no se lista: se conserva por historial, no se ve en gestión.
    where: { status: { not: 'ARCHIVADO' } },
    include: {
      category: true,
      images: { orderBy: { position: 'asc' } },
      variants: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    fabrics: p.fabrics,
    occasions: p.occasions,
    sizes: p.variants.map((v) => v.size),
    stock: p.variants.reduce((acc, v) => acc + v.stock, 0),
    productionHours: p.productionHours,
    images: p.images.map((i) => i.url),
    featured: p.featured,
    status: p.status,
    isDemo: p.isDemo,
  }));
}
