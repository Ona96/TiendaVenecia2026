import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { fetchMercadoPagoPayment } from '@/server/integrations/mercadopago';
import { processMercadoPagoPayment } from '@/server/store/payments';

/**
 * Webhook de Mercado Pago (Fase 6).
 *
 * Seguridad:
 *  - Firma x-signature verificada con MP_WEBHOOK_SECRET (HMAC-SHA256,
 *    comparación constante). Sin secreto configurado: 401 (fail-closed).
 *  - El cuerpo NUNCA se confía: el pago se relee contra la API de MP.
 *  - Idempotente por diseño (ver src/server/store/payments.ts).
 *  - Siempre 200 ante payloads bien firmados: MP reintenta ante errores
 *    y el procesamiento interno ya es seguro ante duplicados.
 */

function verifySignature(
  mpPaymentId: string | number,
  requestId: string | null,
  signatureHeader: string | null,
): boolean {
  if (!env.mpWebhookSecret) return false;
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((kv) => {
      const [k, v] = kv.split('=');
      return [k?.trim(), v?.trim()];
    }),
  ) as Record<string, string | undefined>;

  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  // El secreto llega como whsec_<clave>: MP usa la parte clave para firmar.
  const secret = env.mpWebhookSecret.startsWith('whsec_')
    ? env.mpWebhookSecret.slice('whsec_'.length)
    : env.mpWebhookSecret;

  const manifest = `id:${mpPaymentId};request-id:${requestId ?? ''};ts:${ts};`;
  const computed = createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(v1, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const raw = await request.text();

  let body: { type?: string; data?: { id?: string | number } };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: 'json inválido' }, { status: 400 });
  }

  const mpPaymentId = body.data?.id;
  if (body.type !== 'payment' || !mpPaymentId) {
    // Notificaciones que no son pagos: se acknolecen sin efecto.
    return NextResponse.json({ received: true });
  }

  const requestId = request.headers.get('x-request-id');
  const signature = request.headers.get('x-signature');

  if (!verifySignature(mpPaymentId, requestId, signature)) {
    console.error('[mp-webhook] firma inválida o ausente', { mpPaymentId });
    return NextResponse.json({ error: 'firma inválida' }, { status: 401 });
  }

  // Fuente de verdad: releer el pago en la API de MP.
  const mp = await fetchMercadoPagoPayment(Number(mpPaymentId));
  if (!mp) {
    console.error('[mp-webhook] no se pudo leer el pago de MP', { mpPaymentId });
    return NextResponse.json({ received: true, processed: false });
  }

  const result = await processMercadoPagoPayment(mp);
  console.log('[mp-webhook]', mpPaymentId, result.detail, result.duplicate ? '(duplicado: no-op)' : '');

  return NextResponse.json({ received: true, processed: result.ok });
}
