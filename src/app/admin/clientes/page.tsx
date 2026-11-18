import { requireAdmin } from '@/server/admin/guard';
import { getAdminCustomers } from '@/server/admin/customers';
import { ClientesClient } from '@/components/admin/ClientesClient';

/**
 * Clientas del atelier (Fase 3): perfiles REALES de la base.
 */
export default async function AdminClientesPage() {
  await requireAdmin();
  const customers = await getAdminCustomers();
  return <ClientesClient customers={customers} />;
}
