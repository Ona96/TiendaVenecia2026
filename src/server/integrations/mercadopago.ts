import { env } from '@/lib/env';
import { fromCents } from '@/lib/money';

/**
 * Integración Mercado Pago (Fase 6).
 *
 * Sin `MP_ACCESS_TOKEN` configurado, la boutique sigue operando 100% con
 * transferencia coordinada: NADA se simula. Con credenciales sandbox o
 * producción cargadas en .env, el checkout ofrece MP automáticamente.
 *
 * Webhook: el servidor SIEMPRE re-lee el pago contra la API de MP;
 * nunca confía en el cuerpo del webhook.
 */

const MP_API = 'https://api.mercadopago.com';

export function isMercadoPagoConfigured(): boolean {
  return Boolean(env.mpAccessToken);
}

/** URL pública del webhook (MP exige URL alcanzable desde internet). */
export function mercadoPagoWebhookUrl(): string {
  return `${env.mpWebhookBaseUrl ?? ''}/api/webhooks/mercadopago`;
}

export interface MpPreferenceItem {
  title: string;
  quantity: number;
  unitPriceCents: number;
}

/**
 * Crea la preferencia de checkout y devuelve el init_point (URL de pago).
 * `externalReference` = id interno del pago: es el vínculo del webhook.
 */
export async function createMercadoPagoPreference(params: {
  orderId: string;
  orderCode: string;
  payerEmail: string;
  payerName: string;
  externalReference: string;
  items: MpPreferenceItem[];
  shippingCents: number;
}): Promise<{ ok: true; initPoint: string } | { ok: false; error: string }> {
  if (!isMercadoPagoConfigured()) {
    return { ok: false, error: 'Mercado Pago no está configurado.' };
  }

  const items = params.items.map((item) => ({
    title: item.title,
    quantity: item.quantity,
    unit_price: fromCents(item.unitPriceCents),
    currency_id: 'ARS',
  }));
  if (params.shippingCents > 0) {
    items.push({
      title: 'Envío',
      quantity: 1,
      unit_price: fromCents(params.shippingCents),
      currency_id: 'ARS',
    });
  }

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.mpAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items,
      external_reference: params.externalReference,
      notification_url: mercadoPagoWebhookUrl(),
      statement_descriptor: 'VENECIA',
      metadata: { order_id: params.orderId, order_code: params.orderCode },
      payer: { email: params.payerEmail, name: params.payerName },
    }),
  });

  if (!res.ok) {
    console.error('[mp] crear preferencia falló:', res.status, await res.text());
    return { ok: false, error: 'No pudimos iniciar el pago de Mercado Pago.' };
  }

  const preference = (await res.json()) as { id: string; init_point?: string; sandbox_init_point?: string };
  const initPoint = preference.init_point ?? preference.sandbox_init_point;
  if (!initPoint) {
    return { ok: false, error: 'Mercado Pago no devolvió una URL de pago.' };
  }
  return { ok: true, initPoint };
}

export interface MpPayment {
  id: number;
  status: 'approved' | 'pending' | 'in_process' | 'rejected' | 'cancelled' | 'refunded';
  external_reference: string | null;
  transaction_amount: number;
  status_detail?: string;
}

/** Re-lee el pago contra la API: única fuente de verdad del webhook. */
export async function fetchMercadoPagoPayment(mpPaymentId: number): Promise<MpPayment | null> {
  if (!isMercadoPagoConfigured()) return null;

  const res = await fetch(`${MP_API}/v1/payments/${mpPaymentId}`, {
    headers: { Authorization: `Bearer ${env.mpAccessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error('[mp] leer pago falló:', res.status);
    return null;
  }
  return (await res.json()) as MpPayment;
}
