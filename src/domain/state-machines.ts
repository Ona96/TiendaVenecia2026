/**
 * Máquinas de estado del dominio comercial.
 * Regla: toda transición de estado se valida contra estas tablas en el
 * servidor antes de escribir; el historial (order_status_history) registra
 * cada cambio con quién y cuándo.
 */

import type { OrderStatus, PaymentStatus, ShippingStatus } from '@prisma/client';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION: 'Pendiente de confirmación',
  CONFIRMADO: 'Confirmado',
  EN_CONFECCION: 'En corte y confección',
  CONTROL_CALIDAD: 'Control de calidad',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

/// Estados que la clienta ve como "en taller" (progreso visible).
export const ORDER_IN_PROGRESS: OrderStatus[] = [
  'PENDIENTE_CONFIRMACION',
  'CONFIRMADO',
  'EN_CONFECCION',
  'CONTROL_CALIDAD',
];

/** Transiciones permitidas del pedido. Cualquier otra se rechaza. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE_CONFIRMACION: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['EN_CONFECCION', 'CANCELADO'],
  EN_CONFECCION: ['CONTROL_CALIDAD', 'CANCELADO'],
  CONTROL_CALIDAD: ['ENVIADO', 'CANCELADO'],
  ENVIADO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

/** Transiciones de pago. El comprobante nunca confirma por sí solo. */
export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDIENTE: ['PENDIENTE_VERIFICACION', 'VERIFICADO', 'RECHAZADO'],
  PENDIENTE_VERIFICACION: ['VERIFICADO', 'RECHAZADO'],
  VERIFICADO: ['REEMBOLSADO'],
  RECHAZADO: ['PENDIENTE_VERIFICACION'],
  REEMBOLSADO: [],
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDIENTE: 'Pendiente',
  PENDIENTE_VERIFICACION: 'Por verificar en banco',
  VERIFICADO: 'Pago verificado',
  RECHAZADO: 'Rechazado',
  REEMBOLSADO: 'Reembolsado',
};

export const SHIPPING_TRANSITIONS: Record<ShippingStatus, ShippingStatus[]> = {
  NO_APLICA: ['A_COTIZAR'],
  A_COTIZAR: ['COTIZADO', 'NO_APLICA'],
  COTIZADO: ['EN_CAMINO'],
  EN_CAMINO: ['ENTREGADO'],
  ENTREGADO: [],
};

export const SHIPPING_STATUS_LABEL: Record<ShippingStatus, string> = {
  NO_APLICA: 'Retiro en boutique',
  A_COTIZAR: 'Envío a cotizar',
  COTIZADO: 'Envío cotizado',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from].includes(to);
}

export function canTransitionShipping(from: ShippingStatus, to: ShippingStatus): boolean {
  return SHIPPING_TRANSITIONS[from].includes(to);
}
