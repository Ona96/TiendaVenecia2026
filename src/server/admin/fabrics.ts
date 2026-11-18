import { prisma } from '@/server/db';

/**
 * Catálogo de telas (Fase 7 — pedido de la boutique).
 * Reglas de integridad:
 *  - El nombre es único e INMUTABLE tras crear: prendas y pedidos guardan
 *    el nombre como texto; renombrarlo dejaría referencias huérfanas.
 *  - Nunca se borra: se archiva (deja de ofrecerse, la historia queda).
 */

export interface FabricView {
  id: string;
  nombre: string;
  descripcion: string | null;
  isDemo: boolean;
  archived: boolean;
  enUso: number;
}

/** Para el panel: todas (incluye archivadas) con cuántas prendas la usan. */
export async function getAdminFabrics(): Promise<FabricView[]> {
  const fabrics = await prisma.fabric.findMany({ orderBy: { nombre: 'asc' } });
  const products = await prisma.product.findMany({
    where: { status: { not: 'ARCHIVADO' } },
    select: { fabrics: true },
  });

  const usage = new Map<string, number>();
  for (const product of products) {
    for (const name of product.fabrics) {
      usage.set(name, (usage.get(name) ?? 0) + 1);
    }
  }

  return fabrics.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    descripcion: f.descripcion,
    isDemo: f.isDemo,
    archived: f.archived,
    enUso: usage.get(f.nombre) ?? 0,
  }));
}

/** Para formularios y facetas: solo las activas (no archivadas). */
export async function getActiveFabricOptions(): Promise<
  { id: string; nombre: string; descripcion: string | null }[]
> {
  const fabrics = await prisma.fabric.findMany({
    where: { archived: false },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, descripcion: true },
  });
  return fabrics;
}
