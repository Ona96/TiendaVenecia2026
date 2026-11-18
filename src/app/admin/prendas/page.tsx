import { requireAdmin } from '@/server/admin/guard';
import { getAdminProducts } from '@/server/admin/products';
import { getActiveFabricOptions } from '@/server/admin/fabrics';
import { PrendasClient } from '@/components/admin/PrendasClient';

/**
 * Prendas del catálogo (Fase 3): datos REALES de la base.
 * Server Component: la consulta corre en el servidor y la guardia
 * también (además de proxy.ts). Las telas del selector también vienen
 * de la base (gestionables en /admin/telas).
 */
export default async function AdminPrendasPage() {
  await requireAdmin();
  const [products, fabricOptions] = await Promise.all([
    getAdminProducts(),
    getActiveFabricOptions(),
  ]);
  return <PrendasClient products={products} fabrics={fabricOptions} />;
}
