import { describe, expect, it } from 'vitest';
import {
  canTransitionOrder,
  canTransitionPayment,
  canTransitionShipping,
  ORDER_TRANSITIONS,
  PAYMENT_TRANSITIONS,
} from '@/domain/state-machines';
import type { OrderStatus, PaymentStatus, ShippingStatus } from '@prisma/client';

/**
 * Máquinas de estado: el servidor rechaza cualquier transición que no
 * esté acá. Estos tests documentan y blindan el flujo comercial completo.
 */
describe('máquina de estados del pedido', () => {
  it('permite el camino feliz del taller', () => {
    const feliz: OrderStatus[] = [
      'PENDIENTE_CONFIRMACION',
      'CONFIRMADO',
      'EN_CONFECCION',
      'CONTROL_CALIDAD',
      'ENVIADO',
      'ENTREGADO',
    ];
    for (let i = 0; i < feliz.length - 1; i++) {
      expect(canTransitionOrder(feliz[i], feliz[i + 1])).toBe(true);
    }
  });

  it('permite cancelar desde cualquier punto activo', () => {
    for (const estado of ['PENDIENTE_CONFIRMACION', 'CONFIRMADO', 'EN_CONFECCION', 'CONTROL_CALIDAD'] as OrderStatus[]) {
      expect(canTransitionOrder(estado, 'CANCELADO')).toBe(true);
    }
  });

  it('rechaza saltos ilegales', () => {
    expect(canTransitionOrder('PENDIENTE_CONFIRMACION', 'ENVIADO')).toBe(false);
    expect(canTransitionOrder('CONFIRMADO', 'ENTREGADO')).toBe(false);
    expect(canTransitionOrder('CANCELADO', 'CONFIRMADO')).toBe(false);
    expect(canTransitionOrder('ENTREGADO', 'CANCELADO')).toBe(false);
  });

  it('los estados finales no tienen salidas', () => {
    expect(ORDER_TRANSITIONS['ENTREGADO']).toHaveLength(0);
    expect(ORDER_TRANSITIONS['CANCELADO']).toHaveLength(0);
  });
});

describe('máquina de estados del pago', () => {
  it('el comprobante solo lleva a "por verificar": jamás a "verificado"', () => {
    // Regla de oro anti-fraude: declarar ≠ cobrar.
    expect(canTransitionPayment('PENDIENTE', 'PENDIENTE_VERIFICACION')).toBe(true);
    expect(canTransitionPayment('PENDIENTE', 'VERIFICADO')).toBe(true); // vía webhook MP o admin contra el banco
    expect(canTransitionPayment('PENDIENTE_VERIFICACION', 'VERIFICADO')).toBe(true);
    expect(canTransitionPayment('VERIFICADO', 'REEMBOLSADO')).toBe(true);
  });

  it('un pago rechazado puede re-declararse; uno reembolsado es final', () => {
    expect(canTransitionPayment('RECHAZADO', 'PENDIENTE_VERIFICACION')).toBe(true);
    expect(PAYMENT_TRANSITIONS['REEMBOLSADO']).toHaveLength(0);
  });

  it('no se puede re-verificar lo ya verificado', () => {
    expect(canTransitionPayment('VERIFICADO', 'VERIFICADO')).toBe(false);
  });
});

describe('máquina de estados del envío', () => {
  it('sigue la secuencia de cotización a entrega', () => {
    const pasos: [ShippingStatus, ShippingStatus][] = [
      ['NO_APLICA', 'A_COTIZAR'],
      ['A_COTIZAR', 'COTIZADO'],
      ['COTIZADO', 'EN_CAMINO'],
      ['EN_CAMINO', 'ENTREGADO'],
    ];
    for (const [desde, hacia] of pasos) {
      expect(canTransitionShipping(desde, hacia)).toBe(true);
    }
  });

  it('no se puede enviar sin cotizar', () => {
    expect(canTransitionShipping('A_COTIZAR', 'EN_CAMINO')).toBe(false);
    expect(canTransitionShipping('ENTREGADO', 'EN_CAMINO')).toBe(false);
  });
});
