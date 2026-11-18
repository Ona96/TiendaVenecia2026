import type { Metadata } from 'next';
import { PresupuestoClient } from '@/components/store/PresupuestoClient';

export const metadata: Metadata = {
  title: 'Pedir presupuesto',
  description:
    '¿Soñás un vestido que no está en el catálogo? Contanos la ocasión y cómo lo imaginás: el taller arma una propuesta a medida con ítems, tiempos y precio.',
};

/**
 * Presupuesto de confección especial: página pública con SEO.
 */
export default function PresupuestoPage() {
  return <PresupuestoClient />;
}
