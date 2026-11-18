import { getPublishedProducts } from '@/server/store/catalog';
import { ColeccionClient } from '@/components/store/ColeccionClient';

/**
 * Colección (Fase 4): catálogo publicado desde la base.
 */
export default async function ColeccionPage() {
  const products = await getPublishedProducts();
  return <ColeccionClient products={products} />;
}
