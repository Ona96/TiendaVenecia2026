'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Acciones del perfil de la clienta (Fase 5).
 * Sesión obligatoria: solo se escribe sobre la propia cuenta.
 */

const measurementsSchema = z.object({
  busto: z.number().int().min(30, 'Busto fuera de rango.').max(250, 'Busto fuera de rango.'),
  cintura: z.number().int().min(30, 'Cintura fuera de rango.').max(250, 'Cintura fuera de rango.'),
  cadera: z.number().int().min(30, 'Cadera fuera de rango.').max(250, 'Cadera fuera de rango.'),
  largo: z.number().int().min(60, 'Largo fuera de rango.').max(220, 'Largo fuera de rango.'),
});

async function requireSession(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase no configurado.');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sesión expirada. Volvé a iniciar sesión.');
  return user.id;
}

/**
 * Guarda UNA NUEVA versión de medidas (append-only: nunca se pisa la
 * anterior). Los pedidos ya hechos conservan las medidas de su momento.
 */
export async function saveMyMeasurements(
  input: z.infer<typeof measurementsSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const profileId = await requireSession();

    const parsed = measurementsSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Medidas inválidas.' };
    }

    await prisma.measurementVersion.create({
      data: { profileId, ...parsed.data, source: 'WEB' },
    });

    revalidatePath('/perfil');
    revalidatePath('/mis-pedidos');
    return { ok: true };
  } catch (err) {
    console.error('[saveMyMeasurements]', err);
    return { ok: false, error: 'No pudimos guardar tus medidas. Probá de nuevo.' };
  }
}

/** Edita el teléfono de la propia cuenta (nada más). */
export async function updateMyPhone(phone: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const profileId = await requireSession();

    await prisma.profile.update({
      where: { id: profileId },
      data: { phone: phone.trim() || null },
    });

    revalidatePath('/perfil');
    return { ok: true };
  } catch (err) {
    console.error('[updateMyPhone]', err);
    return { ok: false, error: 'No pudimos guardar tu teléfono.' };
  }
}
