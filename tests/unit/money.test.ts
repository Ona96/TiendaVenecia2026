import { describe, expect, it } from 'vitest';
import { toCents, fromCents, formatCents, applyPercentageCents } from '@/lib/money';

/**
 * Regla de dominio: el dinero viaja en centavos ENTEROS. Jamás float en
 * importes. Estos tests blindan las conversiones que usa todo el flujo
 * comercial (precios, subtotales, señas, saldos).
 */
describe('dinero en centavos', () => {
  it('convierte pesos ARS a centavos exactos', () => {
    expect(toCents(890000)).toBe(89000000);
    expect(toCents(1)).toBe(100);
    expect(toCents(0)).toBe(0);
  });

  it('redondea centavos fraccionarios al entero más cercano (nunca float en DB)', () => {
    expect(toCents(0.005)).toBe(1); // 0.5 centavos → 1
    expect(Number.isInteger(toCents(1234.567))).toBe(true);
  });

  it('vuelve de centavos a pesos sin perder precisión comercial', () => {
    expect(fromCents(89000000)).toBe(890000);
    expect(fromCents(350000)).toBe(3500);
  });

  it('aplica porcentajes enteros redondeando al centavo', () => {
    // 10% de $890.000 = $89.000 → 8.900.000 centavos
    expect(applyPercentageCents(89000000, 10)).toBe(8900000);
    // 33% de $100.001 ($10.000,33 → centavo 10.000,33*0,33 = 3.300,1089 → 3.300,11)
    expect(applyPercentageCents(10000100, 33)).toBe(3300033);
  });

  it('formatea como ARS sin decimales', () => {
    const formatted = formatCents(89000000);
    // es-AR: punto como separador de miles, sin coma decimal.
    expect(formatted).toContain('890.000');
    expect(formatted).not.toContain(',');
  });
});
