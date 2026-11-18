# Fase 5 - Pedidos especiales (completada en su núcleo)

## Criterios de aceptación (de `docs/AUDITORIA-FASE-0.md`)

> Medidas versionadas, presupuestos versionados, confección ligera
> (pruebas/arreglos), señas y saldos.
> Medidas modificadas después de la compra no alteran el snapshot del pedido.

## 5a. Perfil real + medidas versionadas — ✅

- `/perfil` (Server Component): datos de la cuenta real (email del auth,
  teléfono editable con `updateMyPhone`), pedidos, historial completo de
  medidas con su origen (web/taller).
- `saveMyMeasurements` (server action, Zod): crea UNA versión nueva en
  `measurement_versions` (append-only, nunca se pisa). Vigente = última.
- Ficha de producto: "usar mis medidas guardadas" lee las vigentes de la
  base (`getMyLatestMeasurements`), no del store demo.

## 5b. Presupuestos versionados — ✅

Flujo completo con estados `ENVIADA → ACLARACION_PENDIENTE | ACEPTADA | RECHAZADA`:

1. **`/presupuesto`** (público, invitadas incluidas): la clienta describe su
   vestido → Quote `QT-<año>-<n>` + **versión 1** (la solicitud, sin precioar).
   Con sesión, queda asociado a su cuenta.
2. **`/admin/presupuestos`** (nueva sección con Scissors en el nav): la admin
   arma la propuesta → **versión 2+** con ítems (nombre/detalle/precio),
   notas y validez en días. Nunca se pisa la anterior.
3. **`/mis-presupuestos`**: la clienta ve su solicitud y la propuesta vigente
   (ítems + total + validez) y **acepta por web** → `acceptedViaWebAt` +
   `acceptanceMethod: WEB` + estado ACEPTADA (auditable).
4. La admin puede pedir aclaración o rechazar (transiciones validadas en el
   servidor por tabla).

## 5c. Señas y saldos — ✅

En el detalle de pedido del panel (`OrderDetailModal`):

- `registerDeposit(amountArs, note)`: crea pago `TRANSFERENCIA ·
  PENDIENTE_VERIFICACION` con `declaredAt`. **Coherencia**: las señas
  comprometidas no pueden superar el total del pedido.
- `verifyDeposit(paymentId, true|false)`: transiciones validadas contra
  `PAYMENT_TRANSITIONS` (el comprobante NUNCA marca "pagado" por sí solo:
  la admin verifica contra el banco); `verifiedByProfile` + `verifiedAt`
  quedan registrados.
- El pedido resume su pago automáticamente (`paymentStatus`).
- Panel de saldo: comprometido / saldo pendiente en centavos.

## Verificación E2E ejecutada (18/11, andamio temporal eliminado después)

Con sesión admin REAL inyectada por cookie (`base64-<base64url>` formato
`@supabase/ssr`) sobre el servidor dev:

| Prueba | Resultado |
|---|---|
| **Criterio de aceptación**: medidas v2 después de un pedido → snapshot del ítem intacto (88/66/148) | ✅ |
| Solicitud pública de presupuesto (invitada) → `QT-2026-0001` + v1 | ✅ |
| Sesión admin inyectada → `getUser()` reconoce a `admin@venecia.com` | ✅ |
| `createQuoteVersion` con sesión admin → v2, subtotal 95.000.000 c (ítems exactos), validez 21 días | ✅ |
| Seña $300.000 → `PENDIENTE_VERIFICACION` → verificar → pago `VERIFICADO` + pedido `VERIFICADO` | ✅ |
| Seña que supera el saldo ($600k comprometidos + $300k > $890k) → rechazada | ✅ |
| Limpieza → base sin rastro (0 pedidos/quotes de prueba, medidas TEST borradas) | ✅ |

Smoke: `/presupuesto`, `/mis-presupuestos`, `/perfil`, `/mis-pedidos` → 200.
Lint 0 · build ✓.

## Pendiente / decisiones abiertas

- **Confección ligera (pruebas de calce / arreglos)**: necesita modelo nuevo
  (citas/eventos del taller) + calendario. Queda para cerrar junto con el
  calendario interno pendiente de Fase 3 — pedido de migración nueva cuando
  la boutique lo confirme como prioritario.
- Conversión presupuesto → pedido (convertedOrderId ya modelado) → Fase 6,
  cuando exista el flujo de pago MP/transferencia completo.
- Email transaccional de la propuesta/aceptación → Fase 6.
