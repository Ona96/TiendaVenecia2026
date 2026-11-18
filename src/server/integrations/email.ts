/**
 * Email transaccional (Fase 6) — ADAPTADOR.
 *
 * Estado: SIN PROVEEDOR CONFIGURADO. Este módulo arma los mensajes reales
 * (plantillas AR/es) y los entrega al proveedor cuando exista la credencial
 * (Resend, Brevo o el SMTP que elija la boutique). Mientras no haya
 * credencial, `sendEmail` REGISTRA el mensaje y devuelve `delivered: false`:
 * jamás se reporta un envío que no ocurrió (regla: nada fingido).
 *
 * Para activar: cargar EMAIL_PROVIDER_URL + EMAIL_PROVIDER_API_KEY en .env
 * (ver .env.example) e implementar el POST en `deliver` (única función
 * pendiente, marcada abajo).
 */

import { env } from '@/lib/env';
import { formatCents } from '@/lib/money';

export interface EmailTemplate {
  to: string;
  subject: string;
  body: string;
  kind: string;
}

export interface EmailResult {
  ok: boolean;
  delivered: boolean;
  detail: string;
}

export function orderConfirmationEmail(params: {
  to: string;
  clientName: string;
  code: string;
  totalCents: number;
}): EmailTemplate {
  return {
    to: params.to,
    kind: 'pedido-confirmado',
    subject: `Venecia · Tu pedido ${params.code} está en la agenda del atelier`,
    body: [
      `Hola ${params.clientName},`,
      '',
      `Gracias por tu pedido ${params.code}. Quedó registrado con un total de ${formatCents(params.totalCents)}.`,
      'Vamos a contactarte para coordinar el pago y cada paso de la confección.',
      '',
      'Con amor del atelier,',
      'Venecia — Alta Costura',
    ].join('\n'),
  };
}

export function quoteProposedEmail(params: {
  to: string;
  clientName: string;
  code: string;
  totalCents: number;
  validUntil: string | null;
}): EmailTemplate {
  return {
    to: params.to,
    kind: 'presupuesto-propuesto',
    subject: `Venecia · Tu presupuesto ${params.code} ya está listo`,
    body: [
      `Hola ${params.clientName},`,
      '',
      `La propuesta de tu vestido especial (${params.code}) ya está disponible en tu cuenta.`,
      `Total: ${formatCents(params.totalCents)}.`,
      params.validUntil ? `Válida hasta el ${params.validUntil}.` : '',
      'Podés aceptarla directamente desde «Mis presupuestos».',
      '',
      'Con amor del atelier,',
      'Venecia — Alta Costura',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

export function paymentVerifiedEmail(params: {
  to: string;
  clientName: string;
  code: string;
  saldoCents: number;
}): EmailTemplate {
  return {
    to: params.to,
    kind: 'pago-verificado',
    subject: `Venecia · Recibimos tu pago del pedido ${params.code}`,
    body: [
      `Hola ${params.clientName},`,
      '',
      'Verificamos tu pago: ¡gracias!',
      params.saldoCents > 0
        ? `Saldo pendiente: ${formatCents(params.saldoCents)}.`
        : 'Tu pedido está totalmente pago.',
      'Seguimos con la confección y te avisamos cada paso.',
      '',
      'Con amor del atelier,',
      'Venecia — Alta Costura',
    ].join('\n'),
  };
}

async function deliver(template: EmailTemplate): Promise<EmailResult> {
  // PENDIENTE DE CREDENCIAL: cuando la boutique elija proveedor, este
  // único bloque hace el POST real. Nada más cambia.
  if (!env.emailProviderUrl || !env.emailProviderKey) {
    console.info(
      `[EMAIL-STUB · no enviado · ${template.kind}] → ${template.to} · "${template.subject}"`,
    );
    return { ok: true, delivered: false, detail: 'proveedor no configurado (stub marcado)' };
  }

  const res = await fetch(env.emailProviderUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.emailProviderKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.emailFrom,
      to: [template.to],
      subject: template.subject,
      text: template.body,
    }),
  });
  if (!res.ok) {
    console.error('[email] proveedor rechazó:', res.status, await res.text());
    return { ok: false, delivered: false, detail: 'proveedor rechazó el envío' };
  }
  return { ok: true, delivered: true, detail: 'enviado' };
}

/** Envía (o registra como stub) un email transaccional. */
export async function sendEmail(template: EmailTemplate): Promise<EmailResult> {
  try {
    return await deliver(template);
  } catch (err) {
    console.error('[email] fallo inesperado:', err);
    return { ok: false, delivered: false, detail: 'fallo inesperado' };
  }
}
