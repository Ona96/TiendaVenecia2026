import { prisma } from '@/server/db';

/**
 * Presupuestos (Fase 5): datos para el panel y para la clienta.
 * Cada versión es inmutable: la vigente es la de mayor `version`.
 * v1 = pedido de la clienta (sin precioar); las siguientes son las
 * propuestas del atelier con ítems y totales en centavos.
 */

export interface AdminQuoteVersionView {
  id: string;
  version: number;
  itemsJson: unknown;
  subtotalCents: number;
  notes: string | null;
  validUntil: string | null;
  acceptedViaWebAt: string | null;
  acceptanceMethod: string | null;
  createdAt: string;
}

export interface AdminQuoteView {
  id: string;
  code: string;
  profileId: string | null;
  email: string;
  name: string;
  phone: string | null;
  status: string;
  isDemo: boolean;
  createdAt: string;
  versions: AdminQuoteVersionView[];
}

export async function getAdminQuotes(): Promise<AdminQuoteView[]> {
  const quotes = await prisma.quote.findMany({
    include: { versions: { orderBy: { version: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return quotes.map((q) => ({
    id: q.id,
    code: q.code,
    profileId: q.profileId,
    email: q.email,
    name: q.name,
    phone: q.phone,
    status: q.status,
    isDemo: q.isDemo,
    createdAt: q.createdAt.toISOString(),
    versions: q.versions.map((v) => ({
      id: v.id,
      version: v.version,
      itemsJson: v.itemsJson,
      subtotalCents: v.subtotalCents,
      notes: v.notes,
      validUntil: v.validUntil?.toISOString() ?? null,
      acceptedViaWebAt: v.acceptedViaWebAt?.toISOString() ?? null,
      acceptanceMethod: v.acceptanceMethod,
      createdAt: v.createdAt.toISOString(),
    })),
  }));
}

/** Presupuestos de la clienta logueada (solo lo propio). */
export async function getMyQuotes(): Promise<AdminQuoteView[]> {
  const { createSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const quotes = await prisma.quote.findMany({
    where: { profileId: user.id },
    include: { versions: { orderBy: { version: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return quotes.map((q) => ({
    id: q.id,
    code: q.code,
    profileId: q.profileId,
    email: q.email,
    name: q.name,
    phone: q.phone,
    status: q.status,
    isDemo: q.isDemo,
    createdAt: q.createdAt.toISOString(),
    versions: q.versions.map((v) => ({
      id: v.id,
      version: v.version,
      itemsJson: v.itemsJson,
      subtotalCents: v.subtotalCents,
      notes: v.notes,
      validUntil: v.validUntil?.toISOString() ?? null,
      acceptedViaWebAt: v.acceptedViaWebAt?.toISOString() ?? null,
      acceptanceMethod: v.acceptanceMethod,
      createdAt: v.createdAt.toISOString(),
    })),
  }));
}
