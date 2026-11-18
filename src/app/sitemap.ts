import type { MetadataRoute } from 'next';
import { getPublishedProducts } from '@/server/store/catalog';

/**
 * Sitemap dinámico: home, colección, presupuesto + una URL por prenda
 * publicada. La base pública se define en NEXT_PUBLIC_SITE_URL (.env).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const products = await getPublishedProducts();

  const statics: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/coleccion`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/presupuesto`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/login`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terminos`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${base}/privacidad`, changeFrequency: 'yearly', priority: 0.1 },
  ];

  return [
    ...statics,
    ...products.map((p) => ({
      url: `${base}/producto/${p.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
