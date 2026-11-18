import { requireAdmin } from '@/server/admin/guard';
import { getAdminOrders } from '@/server/admin/orders';
import { PedidosClient } from '@/components/admin/PedidosClient';

/**
 * Pedidos del taller (Fase 3): datos REALES de la base.
 */
export default async function AdminPedidosPage() {
  await requireAdmin();
  const orders = await getAdminOrders();
  return <PedidosClient orders={orders} />;
}
