import { prisma } from '@/server/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Perfil de la clienta (server). Sesión httpOnly: solo lo propio.
 * Medidas: historial append-only (`measurement_versions`); la vigente
 * es la última. Cambiar medidas JAMÁS altera pedidos ya hechos (los
 * ítems guardan copia, no referencia — regla de dominio verificada).
 */

export interface MyMeasurements {
  busto: number;
  cintura: number;
  cadera: number;
  largo: number;
}

export interface MyProfileView {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  latest: MyMeasurements | null;
  history: { at: string; source: string; measurements: MyMeasurements }[];
  ordersCount: number;
}

export async function getMyProfile(): Promise<MyProfileView | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      measurements: { orderBy: { at: 'desc' } },
      orders: { select: { id: true } },
    },
  });
  if (!profile) return null;

  const history = profile.measurements.map((m) => ({
    at: m.at.toISOString(),
    source: m.source,
    measurements: { busto: m.busto, cintura: m.cintura, cadera: m.cadera, largo: m.largo },
  }));

  return {
    id: profile.id,
    name: profile.name,
    email: user.email ?? '',
    phone: profile.phone,
    role: profile.role,
    createdAt: profile.createdAt.toISOString(),
    latest: history[0]?.measurements ?? null,
    history,
    ordersCount: profile.orders.length,
  };
}

/** Medidas vigentes de la sesión (para la ficha de producto). */
export async function getMyLatestMeasurements(): Promise<MyMeasurements | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const latest = await prisma.measurementVersion.findFirst({
    where: { profileId: user.id },
    orderBy: { at: 'desc' },
  });
  if (!latest) return null;

  return { busto: latest.busto, cintura: latest.cintura, cadera: latest.cadera, largo: latest.largo };
}
