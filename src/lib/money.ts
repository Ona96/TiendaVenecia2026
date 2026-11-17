/**
 * Dinero en centavos enteros. Regla de dominio: jamás float para importes.
 * Toda la contabilidad (precios, subtotales, promociones, pagos) viaja en
 * centavos ARS y solo se convierte a string legible al mostrar.
 */

export const CENTS_PER_UNIT = 100;

/** Convierte pesos ARS (p. ej. 890000) a centavos enteros (89000000). */
export function toCents(pesos: number): number {
  return Math.round(pesos * CENTS_PER_UNIT);
}

/** Convierte centavos a pesos (unidad monetaria legible). */
export function fromCents(cents: number): number {
  return cents / CENTS_PER_UNIT;
}

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/** Formatea centavos para mostrar: formatCents(89000000) → "$ 890.000". */
export function formatCents(cents: number): string {
  return arsFormatter.format(fromCents(cents));
}

/** Aplica un porcentaje entero (1–100) sobre centavos, redondeando a centavo. */
export function applyPercentageCents(cents: number, percentage: number): number {
  return Math.round((cents * percentage) / 100);
}
