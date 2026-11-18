/**
 * Verificación de la capa de datos del admin (Fase 3).
 * Ejecuta las consultas reales contra Supabase: npx tsx scripts/verify-admin-data.ts
 */
import { prisma } from '../src/server/db';
import { getAdminProducts } from '../src/server/admin/products';
import { getAdminOrders } from '../src/server/admin/orders';
import { getAdminCustomers } from '../src/server/admin/customers';
import { getDashboardStats } from '../src/server/admin/stats';

async function main() {
  const products = await getAdminProducts();
  console.log(`✅ Productos del panel: ${products.length} (demo: ${products.filter((p) => p.isDemo).length})`);
  for (const p of products) {
    console.log(`   · ${p.name} — ${p.categoryName} — ${p.stock} cupos — ${p.status}`);
  }

  const orders = await getAdminOrders();
  console.log(`✅ Pedidos del panel: ${orders.length}`);

  const customers = await getAdminCustomers();
  console.log(`✅ Clientas (perfiles reales): ${customers.length}`);
  for (const c of customers) {
    console.log(`   · ${c.name} — ${c.email ?? 'sin email'} — rol ${c.role} — ${c.ordersCount} pedidos`);
  }
  const sinEmail = customers.filter((c) => !c.email).length;
  if (sinEmail > 0) {
    console.log(`⚠️  ${sinEmail} perfil(es) sin email visible (¿trigger de perfil sin cuenta auth?)`);
  }

  const stats = await getDashboardStats();
  console.log('✅ Dashboard:');
  console.log(`   · Ingresos: ${stats.revenueCents} centavos`);
  console.log(`   · Prendas publicadas: ${stats.publishedCount} · otras: ${stats.otherProductsCount}`);
  console.log(`   · Clientas CLIENTE: ${stats.customersCount}`);
  console.log(`   · Cupos críticos: ${stats.lowStock.length}`);

  // Sanidad: el admin real (kvnrenott) debe figurar como ADMIN.
  const kevin = customers.find((c) => c.email === 'kvnrenott@gmail.com');
  console.log(
    kevin?.role === 'ADMIN'
      ? '✅ kvnrenott@gmail.com figura como ADMIN en la capa del panel'
      : '❌ El admin real no aparece correctamente',
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Fallo:', err);
  process.exit(1);
});
