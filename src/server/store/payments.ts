import { prisma } from '@/server/db';
import { canTransitionPayment } from '@/domain/state-machines';
import { sendEmail, paymentVerifiedEmail } from '@/server/integrations/email';
import type { PaymentStatus } from '@prisma/client';
import type { MpPayment } from '@/server/integrations/mercadopago';

/**
 * Núcleo de procesamiento de pagos de Mercado Pago (Fase 6).
 *
 * Idempotencia doble (un mismo pago de MP nunca aplica dos veces):
 *   1. La fila interna guarda `mpPaymentId` (unique en la base).
 *   2. Antes de tocar algo, se re-verifica el estado actual.
 *
 * El comprobante de MP solo aplica estados legales de la máquina de pagos.
 * El stock se consumió en el checkout (reserva ligada al pedido): acá se
 * marca CONSUMIDA; si la reserva ya había vencido, se reintenta el
 * descuento y, si no hay stock, queda anotado para revisión de la admin
 * (la plata es real: nunca la "deshacemos" automáticamente).
 */

export interface ProcessResult {
  ok: boolean;
  duplicate?: boolean;
  detail: string;
}

export async function processMercadoPagoPayment(mp: MpPayment): Promise<ProcessResult> {
  if (!mp.external_reference) {
    return { ok: false, detail: 'Pago de MP sin referencia interna.' };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: mp.external_reference },
    include: { order: true },
  });
  if (!payment) {
    return { ok: false, detail: 'Referencia interna desconocida.' };
  }

  // Idempotencia 1: este pago de MP ya fue procesado sobre esta fila.
  if (payment.mpPaymentId === String(mp.id)) {
    return { ok: true, duplicate: true, detail: 'Ya procesado (misma fila).' };
  }

  // Idempotencia 2: cualquier otra fila ya consumió este mpPaymentId.
  const elsewhere = await prisma.payment.findFirst({
    where: { mpPaymentId: String(mp.id) },
  });
  if (elsewhere) {
    return { ok: true, duplicate: true, detail: 'Ya procesado (otra fila).' };
  }

  const nextStatus: PaymentStatus | null =
    mp.status === 'approved'
      ? 'VERIFICADO'
      : mp.status === 'rejected' || mp.status === 'cancelled'
        ? 'RECHAZADO'
        : mp.status === 'refunded'
          ? 'REEMBOLSADO'
          : null; // pending/in_process: solo queda registrado, sin transición.

  if (nextStatus && !canTransitionPayment(payment.status, nextStatus)) {
    return { ok: false, detail: `Transición ${payment.status} → ${nextStatus} no permitida.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        mpPaymentId: String(mp.id),
        ...(nextStatus
          ? {
              status: nextStatus,
              verifiedAt: nextStatus === 'VERIFICADO' ? new Date() : payment.verifiedAt,
              note: `MP ${mp.status}${mp.status_detail ? ` (${mp.status_detail})` : ''}`,
            }
          : { note: `MP ${mp.status} (sin transición)` }),
      },
    });

    if (nextStatus === 'VERIFICADO') {
      // Reservas del pedido: se consumen. Si ya vencieron, reintento el
      // stock; si no alcanza, queda anotado (decisión humana).
      const reservations = await tx.reservation.findMany({
        where: { orderId: payment.orderId, status: 'ACTIVA' },
      });
      for (const reservation of reservations) {
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: 'CONSUMIDA' },
        });
      }

      if (reservations.length === 0) {
        const expiredOnes = await tx.reservation.findMany({
          where: { orderId: payment.orderId, status: 'LIBERADA' },
        });
        for (const reservation of expiredOnes) {
          const variant = await tx.productVariant.findUnique({
            where: { id: reservation.variantId },
          });
          if (variant && variant.stock >= reservation.quantity) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: { decrement: reservation.quantity } },
            });
            await tx.reservation.update({
              where: { id: reservation.id },
              data: { status: 'CONSUMIDA' },
            });
          } else {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                note: `${mp.status} · RESERVA VENCIDA: stock insuficiente, revisar manualmente`,
              },
            });
          }
        }
      }

      // Resumen del pedido (misma lógica que la verificación manual).
      const payments = await tx.payment.findMany({ where: { orderId: payment.orderId } });
      const anyVerified = payments.some((p) => p.status === 'VERIFICADO');
      const anyPendingCheck = payments.some((p) => p.status === 'PENDIENTE_VERIFICACION');
      const orderStatus: PaymentStatus = anyVerified
        ? 'VERIFICADO'
        : anyPendingCheck
          ? 'PENDIENTE_VERIFICACION'
          : 'PENDIENTE';
      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: orderStatus },
      });

      // Aviso a la clienta con el saldo real (stub marcado sin proveedor).
      const committed = payments
        .filter((p) => p.status !== 'RECHAZADO' && p.status !== 'REEMBOLSADO')
        .reduce((acc, p) => acc + p.amountCents, 0);
      await sendEmail(
        paymentVerifiedEmail({
          to: payment.order.email,
          clientName: payment.order.shipName,
          code: payment.order.code,
          saldoCents: Math.max(0, payment.order.totalCents - committed),
        }),
      );
    }
  });

  return {
    ok: true,
    detail: nextStatus ? `Pago ${mp.status} → ${nextStatus}` : `Pago ${mp.status} registrado`,
  };
}
