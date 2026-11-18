'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { assertAdmin } from '@/server/admin/guard';
import { toCents } from '@/lib/money';
import { slugify } from '@/lib/utils';
import { canTransitionOrder, canTransitionShipping } from '@/domain/state-machines';
import { canTransitionPayment } from '@/domain/state-machines';
import type { OrderStatus, PaymentStatus } from '@prisma/client';

/**
 * Acciones de catálogo del panel (server actions).
 *
 * Reglas de dominio que se cumplen ACÁ (nunca en el navegador):
 *   - El dinero se guarda en centavos enteros.
 *   - No se borra: ARCHIVADO conserva la historia comercial. Solo el
 *     limpiador de demo (db:seed:clean) puede eliminar prendas isDemo.
 *   - Toda acción exige sesión ADMIN real (assertAdmin).
 *   - Validación con Zod antes de tocar la base.
 */

const productSchema = z.object({
  name: z.string().trim().min(1, 'El vestido necesita un nombre.'),
  description: z.string().trim().min(10, 'Escribí una descripción editorial (mínimo 10 caracteres).'),
  priceArs: z.number().int().positive('Ingresá un precio válido mayor a cero.'),
  categorySlug: z.string().min(1),
  fabrics: z.array(z.string()).min(1, 'Elegí al menos una tela.'),
  occasions: z.array(z.string()),
  sizes: z.array(z.string()),
  stock: z.number().int().min(0),
  productionHours: z.number().int().min(1),
  images: z.array(z.string()),
  featured: z.boolean(),
  status: z.enum(['PUBLICADO', 'PAUSADO']),
});

export type ProductInput = z.infer<typeof productSchema>;

export async function saveProduct(
  input: ProductInput,
  productId?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertAdmin();

    const parsed = productSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }
    const data = parsed.data;

    const category = await prisma.category.findUnique({
      where: { slug: data.categorySlug },
    });
    if (!category) return { ok: false, error: 'La categoría elegida no existe.' };

    const base = {
      name: data.name,
      description: data.description,
      priceCents: toCents(data.priceArs),
      fabrics: data.fabrics,
      occasions: data.occasions,
      productionHours: data.productionHours,
      featured: data.featured,
      status: data.status,
      sellable: true,
      madeToMeasure: true,
      categoryId: category.id,
    };

    if (productId) {
      const existing = await prisma.product.findUnique({ where: { id: productId } });
      if (!existing) return { ok: false, error: 'La prenda ya no existe.' };

      await prisma.$transaction(async (tx) => {
        await tx.product.update({ where: { id: productId }, data: base });

        // Variantes: reemplazo completo por talles (estado de stock del panel).
        await tx.productVariant.deleteMany({ where: { productId } });
        if (data.sizes.length > 0) {
          const perSize = Math.max(0, Math.floor(data.stock / data.sizes.length));
          await tx.productVariant.createMany({
            data: data.sizes.map((size) => ({
              productId,
              size,
              stock: perSize,
            })),
          });
        }

        // Imágenes: reemplazo por lista (posición = orden).
        await tx.productImage.deleteMany({ where: { productId } });
        const urls = data.images.filter(Boolean);
        if (urls.length > 0) {
          await tx.productImage.createMany({
            data: urls.map((url, index) => ({
              productId,
              url,
              alt: `${data.name} - vista ${index + 1}`,
              position: index,
            })),
          });
        }
      });
    } else {
      // Alta: slug único derivado del nombre.
      let slug = slugify(data.name) || `vestido-${Date.now()}`;
      const clash = await prisma.product.findUnique({ where: { slug } });
      if (clash) slug = `${slug}-${Date.now()}`;

      await prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
          data: {
            ...base,
            slug,
            madeToOrder: data.sizes.length === 0,
          },
        });

        if (data.sizes.length > 0) {
          const perSize = Math.max(0, Math.floor(data.stock / data.sizes.length));
          await tx.productVariant.createMany({
            data: data.sizes.map((size) => ({
              productId: created.id,
              size,
              stock: perSize,
            })),
          });
        }

        const urls =
          data.images.length > 0 ? data.images.filter(Boolean) : [`/images/products/${slug}-1.jpg`];
        await tx.productImage.createMany({
          data: urls.map((url, index) => ({
            productId: created.id,
            url,
            alt: `${data.name} - vista ${index + 1}`,
            position: index,
          })),
        });
      });
    }

    revalidatePath('/admin/prendas');
    revalidatePath('/coleccion');
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    console.error('[saveProduct]', err);
    return { ok: false, error: 'No pudimos guardar la prenda. Probá de nuevo.' };
  }
}

export async function setProductStatus(
  productId: string,
  next: 'PUBLICADO' | 'PAUSADO',
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) return { ok: false, error: 'La prenda ya no existe.' };

    // Transiciones permitidas: PUBLICADO <-> PAUSADO. ARCHIVADO es una vía.
    const valid =
      (existing.status === 'PUBLICADO' && next === 'PAUSADO') ||
      (existing.status === 'PAUSADO' && next === 'PUBLICADO');
    if (!valid) {
      return { ok: false, error: `No se puede pasar de ${existing.status} a ${next}.` };
    }

    await prisma.product.update({ where: { id: productId }, data: { status: next } });
    revalidatePath('/admin/prendas');
    revalidatePath('/coleccion');
    return { ok: true };
  } catch (err) {
    console.error('[setProductStatus]', err);
    return { ok: false, error: 'No pudimos cambiar el estado.' };
  }
}

export async function archiveProduct(
  productId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertAdmin();
    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existing) return { ok: false, error: 'La prenda ya no existe.' };
    if (existing.status === 'ARCHIVADO') {
      return { ok: false, error: 'La prenda ya está archivada.' };
    }

    // Nunca borrado físico: se archiva y sale de la gestión/storefront.
    // La historia comercial (pedidos, reseñas) queda intacta.
    await prisma.product.update({ where: { id: productId }, data: { status: 'ARCHIVADO' } });
    revalidatePath('/admin/prendas');
    revalidatePath('/coleccion');
    return { ok: true };
  } catch (err) {
    console.error('[archiveProduct]', err);
    return { ok: false, error: 'No pudimos archivar la prenda.' };
  }
}

export async function updateOrderStatus(
  orderId: string,
  next: OrderStatus,
  note?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await assertAdmin();

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { ok: false, error: 'El pedido ya no existe.' };

    // Máquina de estados: el servidor decide qué transiciones son legales.
    if (!canTransitionOrder(order.status, next)) {
      return {
        ok: false,
        error: `No se puede pasar de «${order.status}» a «${next}».`,
      };
    }

    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status: next } }),
      // Historial auditable: quién, cuándo, qué y por qué.
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          from: order.status,
          to: next,
          byProfileId: admin.id,
          note: note?.trim() || null,
        },
      }),
    ]);

    revalidatePath('/admin/pedidos');
    revalidatePath('/admin');
    return { ok: true };
  } catch (err) {
    console.error('[updateOrderStatus]', err);
    return { ok: false, error: 'No pudimos actualizar el estado.' };
  }
}

export async function updateCustomerContact(
  profileId: string,
  phone: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertAdmin();

    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) return { ok: false, error: 'La clienta ya no existe.' };

    await prisma.profile.update({
      where: { id: profileId },
      // El rol jamás se toca acá (la guardia anti-escalada lo protege igual).
      data: { phone: phone || null },
    });

    revalidatePath('/admin/clientes');
    return { ok: true };
  } catch (err) {
    console.error('[updateCustomerContact]', err);
    return { ok: false, error: 'No pudimos guardar el teléfono.' };
  }
}

export async function registerDeposit(
  orderId: string,
  amountArs: number,
  note?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertAdmin();

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { ok: false, error: 'El pedido ya no existe.' };

    if (!Number.isInteger(amountArs) || amountArs <= 0) {
      return { ok: false, error: 'Ingresá un monto válido en pesos.' };
    }
    const amountCents = toCents(amountArs);

    // Control de coherencia: las señas comprometidas no superan el total.
    const payments = await prisma.payment.findMany({ where: { orderId } });
    const committed = payments
      .filter((p) => p.status !== 'RECHAZADO' && p.status !== 'REEMBOLSADO')
      .reduce((acc, p) => acc + p.amountCents, 0);
    if (committed + amountCents > order.totalCents) {
      return {
        ok: false,
        error: 'La seña supera el saldo pendiente del pedido.',
      };
    }

    await prisma.payment.create({
      data: {
        orderId,
        method: 'TRANSFERENCIA',
        status: 'PENDIENTE_VERIFICACION',
        amountCents,
        currency: 'ARS',
        note: note?.trim() || null,
        declaredAt: new Date(),
      },
    });

    revalidatePath('/admin/pedidos');
    return { ok: true };
  } catch (err) {
    console.error('[registerDeposit]', err);
    return { ok: false, error: 'No pudimos registrar la seña.' };
  }
}

export async function verifyDeposit(
  paymentId: string,
  verified: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await assertAdmin();

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return { ok: false, error: 'El pago ya no existe.' };

    const next: PaymentStatus = verified ? 'VERIFICADO' : 'RECHAZADO';
    if (!canTransitionPayment(payment.status, next)) {
      return { ok: false, error: `No se puede pasar de ${payment.status} a ${next}.` };
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: next, verifiedAt: new Date(), verifiedByProfile: admin.id },
    });

    // El estado de pago del pedido resume sus pagos: si alguno verificó,
    // el pedido pasa a PENDIENTE_VERIFICACION (o queda PENDIENTE).
    const payments = await prisma.payment.findMany({ where: { orderId: payment.orderId } });
    const anyVerified = payments.some((p) => p.status === 'VERIFICADO');
    const anyPendingCheck = payments.some((p) => p.status === 'PENDIENTE_VERIFICACION');
    const paymentStatus: PaymentStatus = anyVerified
      ? 'VERIFICADO'
      : anyPendingCheck
        ? 'PENDIENTE_VERIFICACION'
        : 'PENDIENTE';

    await prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus },
    });

    revalidatePath('/admin/pedidos');
    revalidatePath('/admin');
    return { ok: true };
  } catch (err) {
    console.error('[verifyDeposit]', err);
    return { ok: false, error: 'No pudimos actualizar el pago.' };
  }
}

// ------------------------------------------------------------
// Envío manual (Fase 6): cotización y avance del envío.
// ------------------------------------------------------------

export async function quoteShipping(
  orderId: string,
  shippingArs: number,
  note?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertAdmin();

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { ok: false, error: 'El pedido ya no existe.' };
    if (order.shippingStatus !== 'A_COTIZAR') {
      return { ok: false, error: 'El envío ya fue cotizado o está en camino.' };
    }
    if (!Number.isInteger(shippingArs) || shippingArs < 0) {
      return { ok: false, error: 'Ingresá un costo de envío válido.' };
    }

    const shippingCents = toCents(shippingArs);
    const totalCents = order.subtotalCents - order.discountCents + shippingCents;

    await prisma.order.update({
      where: { id: orderId },
      data: { shippingCents, totalCents, shippingStatus: 'COTIZADO' },
    });
    if (note?.trim()) {
      await prisma.order.update({
        where: { id: orderId },
        data: { workshopNotes: order.workshopNotes ? `${order.workshopNotes}\n${note.trim()}` : note.trim() },
      });
    }

    revalidatePath('/admin/pedidos');
    return { ok: true };
  } catch (err) {
    console.error('[quoteShipping]', err);
    return { ok: false, error: 'No pudimos cotizar el envío.' };
  }
}

export async function advanceShipping(
  orderId: string,
  next: 'EN_CAMINO' | 'ENTREGADO',
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertAdmin();

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { ok: false, error: 'El pedido ya no existe.' };

    if (!canTransitionShipping(order.shippingStatus, next)) {
      return {
        ok: false,
        error: `No se puede pasar el envío de ${order.shippingStatus} a ${next}.`,
      };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { shippingStatus: next },
    });

    // Un envío entregado completa el ciclo comercial del pedido.
    if (next === 'ENTREGADO' && canTransitionOrder(order.status, 'ENTREGADO')) {
      await prisma.$transaction([
        prisma.order.update({ where: { id: orderId }, data: { status: 'ENTREGADO' } }),
        prisma.orderStatusHistory.create({
          data: { orderId, from: order.status, to: 'ENTREGADO', note: 'Entrega del envío' },
        }),
      ]);
    }

    revalidatePath('/admin/pedidos');
    revalidatePath('/mis-pedidos');
    return { ok: true };
  } catch (err) {
    console.error('[advanceShipping]', err);
    return { ok: false, error: 'No pudimos actualizar el envío.' };
  }
}
