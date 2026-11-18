/**
 * Chequeo rápido del modelo Fabric tras la migración.
 */
import { prisma } from '../src/server/db';

async function main() {
  const count = await prisma.fabric.count();
  console.log(`✅ Modelo Fabric operativo — filas: ${count}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
