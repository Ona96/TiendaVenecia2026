/* ============================================================
   Venecia — Datos semilla de la demo (VACÍO)
   Los stores mantienen la forma del seed pero sin datos: la
   boutique decidió usar el mismo proyecto Supabase para
   producción, así que la demo se eliminó por completo
   (18/11/2026). Ver prisma/seed-clean.ts (contenido isDemo de
   la base) y scripts/cleanup-demo.ts (cuentas demo del auth).
   ============================================================ */

import type { Customer, Order, Product, User } from '@/lib/types';

export const seedUsers: User[] = [];
export const seedCustomers: Customer[] = [];
export const seedProducts: Product[] = [];
export const seedOrders: Order[] = [];
