'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { assertAdmin } from '@/server/admin/guard';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { toCents } from '@/lib/money';
import { sendEmail, quoteProposedEmail } from '@/server/integrations/email';

/**
 * Presupuestos (Fase 5).
 *
 * Flujo:
 *   1. `requestQuote` — la clienta (o invitada) describe su vestido: crea
 *      Quote ENVIADA + versión 1 (el pedido, sin precioar).
 *   2. `createQuoteVersion` — la admin arma la propuesta: nueva versión
 *      con ítems y totales en centavos (nunca se pisa la anterior).
 *   3. `acceptQuoteWeb` — la clienta logueada acepta la versión vigente:
 *      queda aceptedViaWebAt + estado ACEPTADA (auditable).
 *   4. `setQuoteStatus` — la admin marca ACLARACION_PENDIENTE/RECHAZADA.
 *
 * Regla de dominio: las versiones son inmutables; corregir un precio
 * siempre crea una versión nueva.
 */

// ---------- 1. Solicitud pública ----------

const requestSchema = z.object({
  name: z.string().trim().min(2, 'Contanos tu nombre.'),
  email: z.string().trim().toLowerCase().email('Ingresá un email válido.'),
  phone: z.string().trim().min(6, 'Ingresá un teléfono de contacto.'),
  occasion: z.string().trim().min(2, 'Contanos la ocasión.'),
  eventDate: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .min(20, 'Describí el vestido con más detalle (mínimo 20 caracteres).'),
  fabricIdeas: z.string().trim().optional(),
  budgetHint: z.string().trim().optional(),
});

export type QuoteRequestInput = z.infer<typeof requestSchema>;

export async function requestQuote(
  input: QuoteRequestInput,
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  try {
    const parsed = requestSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }
    const data = parsed.data;

    // Sesión opcional: si está logueada, el presupuesto queda en su cuenta.
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

    const year = new Date().getFullYear();
    const count = await prisma.quote.count();
    const code = `QT-${year}-${String(count + 1).padStart(4, '0')}`;

    await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.create({
        data: {
          code,
          profileId: user?.id ?? null,
          email: data.email,
          name: data.name,
          phone: data.phone,
          status: 'ENVIADA',
        },
      });

      // Versión 1: el pedido tal como lo contó la clienta (sin precioar).
      await tx.quoteVersion.create({
        data: {
          quoteId: quote.id,
          version: 1,
          itemsJson: {
            tipo: 'solicitud',
            ocasion: data.occasion,
            fechaEvento: data.eventDate || null,
            descripcion: data.description,
            telasIdea: data.fabricIdeas || null,
            presupuestoOrientativo: data.budgetHint || null,
          },
          subtotalCents: 0,
        },
      });
    });

    revalidatePath('/admin/presupuestos');
    return { ok: true, code };
  } catch (err) {
    console.error('[requestQuote]', err);
    return { ok: false, error: 'No pudimos registrar tu solicitud. Probá de nuevo.' };
  }
}

// ---------- 2. Versión del atelier (admin) ----------

const versionItemSchema = z.object({
  nombre: z.string().trim().min(1, 'Cada ítem necesita nombre.'),
  detalle: z.string().trim().optional(),
  priceArs: z.number().int().min(0),
});

const versionSchema = z.object({
  quoteId: z.string().min(1),
  items: z.array(versionItemSchema).min(1, 'Cargá al menos un ítem.'),
  notes: z.string().trim().optional(),
  validDays: z.number().int().min(1).max(120).default(30),
});

export async function createQuoteVersion(
  input: z.infer<typeof versionSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertAdmin();

    const parsed = versionSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }
    const data = parsed.data;

    const quote = await prisma.quote.findUnique({
      where: { id: data.quoteId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!quote) return { ok: false, error: 'El presupuesto ya no existe.' };

    const nextVersion = (quote.versions[0]?.version ?? 0) + 1;
    const subtotalCents = data.items.reduce((acc, i) => acc + toCents(i.priceArs), 0);
    const validUntil = new Date(Date.now() + data.validDays * 86_400_000);

    const version = await prisma.quoteVersion.create({
      data: {
        quoteId: quote.id,
        version: nextVersion,
        itemsJson: {
          tipo: 'propuesta',
          items: data.items.map((i) => ({
            nombre: i.nombre,
            detalle: i.detalle ?? null,
            priceCents: toCents(i.priceArs),
          })),
        },
        subtotalCents,
        notes: data.notes || null,
        validUntil,
      },
    });

    // Aviso a la clienta (proveedor o stub marcado; nunca bloquea).
    await sendEmail(
      quoteProposedEmail({
        to: quote.email,
        clientName: quote.name,
        code: quote.code,
        totalCents: subtotalCents,
        validUntil: validUntil.toISOString().slice(0, 10),
      }),
    );

    revalidatePath('/admin/presupuestos');
    revalidatePath('/mis-presupuestos');
    return { ok: true };
  } catch (err) {
    console.error('[createQuoteVersion]', err);
    return { ok: false, error: 'No pudimos guardar la versión.' };
  }
}

// ---------- 3. Aceptación web de la clienta ----------

export async function acceptQuoteWeb(
  quoteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { ok: false, error: 'Sesión no disponible.' };

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Iniciá sesión para aceptar tu presupuesto.' };

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!quote || quote.profileId !== user.id) {
      return { ok: false, error: 'Ese presupuesto no es tuyo.' };
    }
    if (quote.status === 'ACEPTADA') {
      return { ok: false, error: 'Ya habías aceptado este presupuesto.' };
    }
    if (quote.status === 'RECHAZADA') {
      return { ok: false, error: 'Este presupuesto fue rechazado.' };
    }

    const latest = quote.versions[0];
    if (!latest || latest.subtotalCents === 0) {
      return { ok: false, error: 'El atelier todavía no cargó la propuesta con precios.' };
    }

    await prisma.$transaction([
      prisma.quote.update({
        where: { id: quoteId },
        data: { status: 'ACEPTADA' },
      }),
      prisma.quoteVersion.update({
        where: { id: latest.id },
        data: { acceptedViaWebAt: new Date(), acceptanceMethod: 'WEB' },
      }),
    ]);

    revalidatePath('/mis-presupuestos');
    revalidatePath('/admin/presupuestos');
    return { ok: true };
  } catch (err) {
    console.error('[acceptQuoteWeb]', err);
    return { ok: false, error: 'No pudimos registrar tu aceptación.' };
  }
}

// ---------- 4. Estado por la admin ----------

const QUOTE_TRANSITIONS: Record<string, string[]> = {
  ENVIADA: ['ACLARACION_PENDIENTE', 'RECHAZADA'],
  ACLARACION_PENDIENTE: ['RECHAZADA'],
  ACEPTADA: [],
  RECHAZADA: [],
};

export async function setQuoteStatus(
  quoteId: string,
  next: 'ACLARACION_PENDIENTE' | 'RECHAZADA',
  note?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) return { ok: false, error: 'El presupuesto ya no existe.' };

    if (!QUOTE_TRANSITIONS[quote.status].includes(next)) {
      return { ok: false, error: `No se puede pasar de ${quote.status} a ${next}.` };
    }

    await prisma.quote.update({ where: { id: quoteId }, data: { status: next } });
    if (note?.trim()) {
      const latest = await prisma.quoteVersion.findFirst({
        where: { quoteId },
        orderBy: { version: 'desc' },
      });
      if (latest) {
        await prisma.quoteVersion.update({
          where: { id: latest.id },
          data: { notes: note.trim() },
        });
      }
    }

    revalidatePath('/admin/presupuestos');
    revalidatePath('/mis-presupuestos');
    return { ok: true };
  } catch (err) {
    console.error('[setQuoteStatus]', err);
    return { ok: false, error: 'No pudimos cambiar el estado.' };
  }
}
