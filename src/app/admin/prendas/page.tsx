import { requireAdmin } from '@/server/admin/guard';
import { getAdminProducts } from '@/server/admin/products';
import { PrendasClient } from '@/components/admin/PrendasClient';

/**
 * Prendas del catálogo (Fase 3): datos REALES de la base.
 * Server Component: la consulta corre en el servidor y la guardia
 * también (además de proxy.ts).
 */
export default async function AdminPrendasPage() {
  await requireAdmin();
  const products = await getAdminProducts();
  return <PrendasClient products={products} />;
}
