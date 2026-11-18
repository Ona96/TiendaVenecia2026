'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SHIPPING_PROVINCES, CUSTOM_SIZE, FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT } from '@/lib/constants';
import {
  isMercadoPagoConfigured,
  createMercadoPagoPreference,
} from '@/server/integrations/mercadopago';
import { sendEmail, orderConfirmationEmail } from '@/server/integrations/email';

/**
 * Checkout (Fase 4): el servidor es la única fuente de verdad comercial.
 *
 * Reglas custodiadas acá (nunca en el navegador):
 *  - Precios y totales: SIEMPRE desde la base, en centavos enteros.
 *  - Stock: se verifica y DECREMENTA dentro de la transacción; una
 *    Reserva ACTIVA con vencimiento la devuelve sola si la clienta no paga.
 *  - Snapshots inmutables: el ítem guarda nombre/imagen/precio del momento.
 *  - Estado inicial: PENDIENTE_CONFIRMACION + pago PENDIENTE (transferencia
 *    se coordina con la boutique; Mercado Pago entra en Fase 6 — nada fake).
 *  - Invitada: profileId null + guestToken privado para acceso futuro.
 */

const RESERVATION_MINUTES = 30;

const measurementsSchema = z.object({
  busto: z.number().int().min(30).max(250),
  cintura: z.number().int().min(30).max(250),
  cadera: z.number().int().min(30).max(250),
  largo: z.number().int().min(60).max(220),
});

const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'Completá tu nombre y apellido.'),
  email: z.string().trim().toLowerCase().email('Ingresá un email válido.'),
  phone: z.string().trim().min(6, 'Ingresá un teléfono de contacto.'),
  street: z.string().trim().min(3, 'Completá la dirección de envío.'),
  city: z.string().trim().min(2, 'Completá la ciudad.'),
  province: z.string().trim(),
  notes: z.string().trim().optional(),
  paymentMethod: z.enum(['TRANSFERENCIA', 'MERCADO_PAGO']).default('TRANSFERENCIA'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        size: z.string().min(1),
        quantity: z
          .number()
          .int()
          .min(1, 'Mínimo una unidad por prenda.')
          .max(5, 'Máximo 5 unidades por prenda.'),
        measurements: measurementsSchema.optional(),
      }),
    )
    .min(1, 'Tu carrito está vacío.'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export interface CheckoutResult {
  ok: true;
  code: string;
  totalCents: number;
  /** Solo con Mercado Pago: URL de pago (la clienta es redirigida). */
  initPoint?: string;
}

export interface CheckoutError {
  ok: false;
  error: string;
}

/**
 * Barre reservas vencidas y devuelve el stock al catálogo.
 * Se invoca al inicio de cada checkout y desde el panel: sin cron, el
 * sistema se auto-corrige en cada uso. Las reservas de pedidos ya
 * verificados (pagados) nunca se liberan.
 */
export async function releaseExpiredReservations(): Promise<number> {
  const expired = await prisma.reservation.findMany({
    where: { status: 'ACTIVA', expiresAt: { lt: new Date() } },
    include: { order: { select: { paymentStatus: true } } },
  });
  let released = 0;
  for (const reservation of expired) {
    if (reservation.order && reservation.order.paymentStatus === 'VERIFICADO') continue;
    await prisma.$transaction([
      prisma.productVariant.update({
        where: { id: reservation.variantId },
        data: { stock: { increment: reservation.quantity } },
      }),
      prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: 'LIBERADA' },
      }),
    ]);
    released += 1;
  }
  return released;
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult | CheckoutError> {
  try {
    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }
    const data = parsed.data;

    if (!(SHIPPING_PROVINCES as readonly string[]).includes(data.province)) {
      return { ok: false, error: 'Elegí una zona de envío válida.' };
    }

    // Stock liberado de reservas abandonadas antes de verificar.
    await releaseExpiredReservations();

    // Sesión (invitada permitida: el modelo soporta compras sin cuenta).
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    const profileId = user?.id ?? null;

    // 1. Validar cada ítem contra el catálogo VIGENTE.
    type ValidatedItem = {
      productId: string;
      variantId: string | null;
      nameSnapshot: string;
      imageSnapshot: string | null;
      size: string;
      madeToMeasure: boolean;
      busto: number | null;
      cintura: number | null;
      cadera: number | null;
      largo: number | null;
      quantity: number;
      unitPriceCents: number;
    };

    const validated: ValidatedItem[] = [];

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: true,
          images: { orderBy: { position: 'asc' }, take: 1 },
        },
      });
      if (!product || product.status !== 'PUBLICADO') {
        return {
          ok: false,
          error: `Una prenda de tu carrito ya no está disponible. Sacala y volvé a intentar.`,
        };
      }

      const isCustom = item.size === CUSTOM_SIZE;
      let variantId: string | null = null;

      if (!isCustom) {
        const variant = product.variants.find((v) => v.size === item.size);
        if (!variant) {
          return {
            ok: false,
            error: `El talle ${item.size} de «${product.name}» ya no se ofrece.`,
          };
        }
        if (variant.stock < item.quantity) {
          return {
            ok: false,
            error: `Quedan ${variant.stock} cupos de «${product.name}» (talle ${item.size}).`,
          };
        }
        variantId = variant.id;
      } else {
        if (!product.madeToMeasure) {
          return { ok: false, error: `«${product.name}» no se confecciona a medida.` };
        }
        if (!item.measurements) {
          return { ok: false, error: `Faltan tus medidas para «${product.name}».` };
        }
      }

      validated.push({
        productId: product.id,
        variantId,
        nameSnapshot: product.name,
        imageSnapshot: product.images[0]?.url ?? null,
        size: item.size,
        madeToMeasure: isCustom,
        busto: isCustom ? item.measurements!.busto : null,
        cintura: isCustom ? item.measurements!.cintura : null,
        cadera: isCustom ? item.measurements!.cadera : null,
        largo: isCustom ? item.measurements!.largo : null,
        quantity: item.quantity,
        // Precio desde la base: lo que manda el navegador se ignora.
        unitPriceCents: product.priceCents,
      });
    }

    // 2. Totales en centavos enteros, calculados acá.
    const subtotalCents = validated.reduce((acc, i) => acc + i.unitPriceCents * i.quantity, 0);
    const freeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD * 100;
    const shippingCents = freeShipping ? 0 : SHIPPING_FLAT * 100;
    const totalCents = subtotalCents + shippingCents;

    // 3. Código público secuencial TV-<año>-<número>.
    const year = new Date().getFullYear();
    const count = await prisma.order.count();
    const code = `TV-${year}-${String(count + 1).padStart(4, '0')}`;

    const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60_000);

    // 4. Transacción: orden + ítems + historial + pago + reservas − stock.
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          code,
          profileId,
          guestToken: profileId ? null : randomUUID(),
          email: data.email,
          status: 'PENDIENTE_CONFIRMACION',
          paymentStatus: 'PENDIENTE',
          shippingMethod: 'ENVIO',
          shippingStatus: 'A_COTIZAR',
          subtotalCents,
          discountCents: 0,
          shippingCents,
          totalCents,
          shipName: data.name,
          shipPhone: data.phone,
          shipStreet: data.street,
          shipCity: data.city,
          shipProvince: data.province,
          workshopNotes: data.notes || null,
        },
      });

      for (const item of validated) {
        await tx.orderItem.create({
          data: {
            orderId: created.id,
            productId: item.productId,
            nameSnapshot: item.nameSnapshot,
            imageSnapshot: item.imageSnapshot,
            size: item.size,
            madeToMeasure: item.madeToMeasure,
            busto: item.busto,
            cintura: item.cintura,
            cadera: item.cadera,
            largo: item.largo,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
          },
        });

        // Stock estándar: se reserva (ligada al pedido desde el inicio),
        // se descuenta YA y se consume al verificarse el pago (Fase 6).
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
          await tx.reservation.create({
            data: {
              variantId: item.variantId,
              orderId: created.id,
              quantity: item.quantity,
              status: 'ACTIVA',
              expiresAt,
            },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: created.id,
          from: null,
          to: 'PENDIENTE_CONFIRMACION',
          note: 'Pedido web',
        },
      });

      // Pago: MP con preferencia (si está configurado) o transferencia
      // coordinada con la boutique. Nada se simula.
      const paymentRow = await tx.payment.create({
        data: {
          orderId: created.id,
          method:
            data.paymentMethod === 'MERCADO_PAGO' && isMercadoPagoConfigured()
              ? 'MERCADO_PAGO'
              : 'TRANSFERENCIA',
          status: 'PENDIENTE',
          amountCents: totalCents,
          currency: 'ARS',
        },
      });

      return { created, paymentRow };
    });

    // 4b. Preferencia de Mercado Pago (si la clienta lo eligió y está activo).
    let initPoint: string | undefined;
    if (data.paymentMethod === 'MERCADO_PAGO' && isMercadoPagoConfigured()) {
      const preference = await createMercadoPagoPreference({
        orderId: order.created.id,
        orderCode: order.created.code,
        payerEmail: data.email,
        payerName: data.name,
        // El webhook de MP vuelve con esta referencia: nuestra fila de pago.
        externalReference: order.paymentRow.id,
        items: validated.map((i) => ({
          title: i.nameSnapshot,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
        })),
        shippingCents,
      });
      if (!preference.ok) {
        // El pedido quedó registrado con transferencia como respaldo:
        // la clienta no pierde la compra por una caída de MP.
        console.error('[placeOrder] preferencia MP falló; queda transferencia como respaldo');
      } else {
        initPoint = preference.initPoint;
      }
    }

    // Email de confirmación (proveedor o stub marcado; nunca bloquea).
    await sendEmail(
      orderConfirmationEmail({
        to: data.email,
        clientName: data.name,
        code: order.created.code,
        totalCents: order.created.totalCents,
      }),
    );

    revalidatePath('/admin');
    revalidatePath('/admin/pedidos');
    revalidatePath('/coleccion');

    return {
      ok: true,
      code: order.created.code,
      totalCents: order.created.totalCents,
      initPoint,
    };
  } catch (err) {
    console.error('[placeOrder]', err);
    return { ok: false, error: 'No pudimos registrar tu pedido. Probá de nuevo en un momento.' };
  }
}
