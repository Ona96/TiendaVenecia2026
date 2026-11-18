import { getPublishedProducts } from '@/server/store/catalog';
import { getActiveFabricOptions } from '@/server/admin/fabrics';
import { ColeccionClient } from '@/components/store/ColeccionClient';

/**
 * Colección (Fase 4): catálogo publicado desde la base.
 * La faceta de telas también es dinámica (/admin/telas).
 */
export default async function ColeccionPage() {
  const [products, fabricOptions] = await Promise.all([
    getPublishedProducts(),
    getActiveFabricOptions(),
  ]);
  return (
    <ColeccionClient
      products={products}
      fabricOptions={fabricOptions.map((f) => f.nombre)}
    />
  );
}
