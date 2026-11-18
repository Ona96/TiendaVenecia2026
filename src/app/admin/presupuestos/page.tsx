import { requireAdmin } from '@/server/admin/guard';
import { getAdminQuotes } from '@/server/admin/quotes';
import { PresupuestosClient } from '@/components/admin/PresupuestosClient';

/**
 * Presupuestos del atelier (Fase 5): versiones inmutables,
 * aceptación web visible, estados con máquina de transiciones.
 */
export default async function AdminPresupuestosPage() {
  await requireAdmin();
  const quotes = await getAdminQuotes();
  return <PresupuestosClient quotes={quotes} />;
}
