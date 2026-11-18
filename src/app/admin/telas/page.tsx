import { requireAdmin } from '@/server/admin/guard';
import { getAdminFabrics } from '@/server/admin/fabrics';
import { TelasClient } from '@/components/admin/TelasClient';

/**
 * Catálogo de telas (gestión de la admin).
 */
export default async function AdminTelasPage() {
  await requireAdmin();
  const fabrics = await getAdminFabrics();
  return <TelasClient fabrics={fabrics} />;
}
