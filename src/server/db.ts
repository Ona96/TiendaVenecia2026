import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma del servidor (singleton). Solo se usa en código que corre
 * en el servidor: Server Components, Server Actions y Route Handlers.
 *
 * El acceso de clientas navegadoras pasa por Supabase + RLS, NUNCA por aquí:
 * este cliente conecta como dueño de las tablas (byplanea RLS). Cualquier
 * acción que lo use debe verificar sesión ADMIN real antes de tocar datos.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
