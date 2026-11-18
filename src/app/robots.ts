import type { MetadataRoute } from 'next';

/**
 * robots: el catálogo se indexa; los flujos personales y el panel no.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/perfil', '/mis-pedidos', '/mis-presupuestos', '/checkout', '/carrito'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
