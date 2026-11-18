# Fase 7 - Calidad (completada)

## Criterios de aceptación (de `docs/AUDITORIA-FASE-0.md`)

> Tests (unit/integración/e2e según corresponda), lint configurado,
> a11y, rendimiento. Suite pasa; lint con errores en 0.

## Suite de tests — ✅ 23/23

Framework: **Vitest 5** (alias `@/`, config en `vitest.config.ts` y
`vitest.config.db.ts`).

- `npm test` — unidad pura, sin base (14 tests, <1s):
  - `tests/unit/money.test.ts`: centavos enteros sin float, conversiones,
    porcentajes redondeados al centavo, formato es-AR sin decimales.
  - `tests/unit/state-machines.test.ts`: camino feliz del pedido,
    cancelaciones, saltos ilegales rechazados, comprobante ≠ "pagado"
    (pago), secuencia de envío, estados finales sin salidas.
- `npm run test:db` — integración contra la base de DEV (9 tests, ~12s,
  en serie por archivo — comparten filas de stock):
  - `payments-idempotency.test.ts` (criterio Fase 6): webhook aprobado
    verifica y consume reserva UNA vez; **duplicado = no-op total**
    (ni fechas ni stock cambian); **pending no transiciona** y la nota
    documenta «sin transición».
  - `checkout.test.ts`: compra válida con **precios desde la base**
    (89000000 c exactos), snapshot del nombre, estado inicial + pago
    transferencia, stock −1 con reserva ligada; rechaza exceso de stock
    con mensaje de cupos, producto fantasma, cantidad fuera de rango y
    medidas fuera de rango (Zod en español); **reserva vencida libera
    el stock** vía barrido.
  - `measurements-snapshot.test.ts` (criterio Fase 5): medidas v2 tras
    la compra NO alteran el snapshot del pedido; append-only verificado.
  - Los tres archivos limpian sus datos (verificado: base en 0 pedidos y
    stock de seed tras la corrida completa).

Mocks mínimos: `next/cache` y `@/lib/supabase/server` (fuera del runtime
de Next no existen cookies de request); la lógica comercial probada es
la real contra Prisma.

## Auditoría de dependencias — ✅ deuda histórica cerrada

- **Override `deepmerge-ts@8`**: cierra las 3 `high` de la CLI de Prisma
  (aceptadas desde Fase 1a). Verificado post-override: `prisma migrate
  status` ✓, `prisma generate` ✓, build ✓.
- **`npm audit --omit=dev`: 0 vulnerabilidades** — el árbol de producción
  (next, react, @prisma/client, @supabase/*, zod, zustand, lucide, clsx)
  está limpio.
- Los advisories restantes son TODOS de tooling dev (ESLint/Tailwind CLI/
  Vitest, varios con rango `*` = sin versión parcheada publicada aún).
  No viajan en el bundle de producción. Se documentan y se re-visitarán
  cuando existan parches.

## Accesibilidad — ✅ 32/32 (`scripts/verify-a11y.ts`)

Rutas verificadas: home, colección, login, presupuesto, carrito.
- Idioma `lang="es"` ✓ · skip-link "Saltar al contenido" ✓ ·
  landmark `<main>` (agregado al login, que estaba fuera del layout de
  tienda) ✓ · inputs cubiertos por label for/envolvente/aria-label
  (agregados: búsqueda, orden y precio máximo de la colección) ✓ ·
  sin `<img>` sin alt ✓ · `:focus-visible` global ✓ ·
  `prefers-reduced-motion` ✓ · esqueletos `aria-hidden` ✓.
- Recorrida de teclado: menú de cuenta con Escape/click-afuera, modales
  con `role="dialog" aria-modal`, navegación de tienda operable por Tab
  (skip-link → header → filtros → tarjetas), botones con `aria-label`
  en acciones icónicas. Recorrido completo documentado para revisión
  humana de la boutique con lector de pantalla (NVDA recomendado).

## Rendimiento — ✅

Build de producción (Turbopack, Next 16.4.6):

- **Storefront público prerenderizado estático**: `/`, `/coleccion`,
  `/presupuesto`, `/login`, `/carrito`, `/checkout` (○) — servibles desde
  CDN; invalidados con `revalidatePath` al cambiar catálogo.
- Dinámicos solo donde corresponde: sesión (`/perfil`, `/mis-pedidos`,
  `/mis-presupuestos`), panel admin, ficha por slug y webhook MP (ƒ).
- Sin librerías pesadas: iconos tree-shakeados (lucide), imágenes por
  `next/image` con fallback elegante, animaciones CSS puras.
- `prefers-reduced-motion` apaga animaciones por sistema operativo.

## Verificación final de la fase

| Prueba | Resultado |
|---|---|
| `npm test` | 14/14 ✅ |
| `npm run test:db` | 9/9 ✅ (base limpia después) |
| `npm run lint` | 0 errores, 0 warnings ✅ |
| `npm run build` | ✓ (18 rutas: 6 estáticas públicas + dinámicas justificadas) |
| `npm audit --omit=dev` | 0 vulnerabilidades ✅ |
| `scripts/verify-a11y.ts` | 32/32 ✅ |
