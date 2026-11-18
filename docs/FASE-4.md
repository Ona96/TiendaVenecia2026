# Fase 4 - Comercial (completada en su núcleo)

## Criterios de aceptación (de `docs/AUDITORIA-FASE-0.md`)

> Catálogo conectado a DB, búsqueda, carrito con validación server,
> checkout, órdenes con snapshots, **reservas de stock con expiración**.
> Dos compradoras por la última unidad nunca venden stock inexistente;
> reserva expira y libera.

## 4a. Storefront sobre la base — ✅

- Mapper `src/server/store/catalog.ts` DB → formato de vistas:
  `/coleccion`, home (`FeaturedCollection` con prop del Server Component)
  y ficha `/producto/[slug]` leen productos PUBLICADO reales.
  PAUSADO/ARCHIVADO → 404 en ficha y fuera de colección.
- El precio mostrado es informativo; **el checkout recalcula todo en el
  servidor desde la base** (regla de dominio).

## 4b. Checkout real — ✅ (`src/server/store/checkout.ts`)

Server action `placeOrder` con Zod; reglas custodiadas:
- Precios/totales SIEMPRE desde la base, en centavos enteros.
- Stock: verifica y **decrementa en la transacción** + `Reservation` ACTIVA
  con vencimiento a 30 min.
- `releaseExpiredReservations()`: barrido que devuelve el stock de reservas
  vencidas — corre al inicio de cada checkout y en el panel (sin cron).
- Snapshots inmutables (nombre/imagen/precio) en `order_items`.
- Invitada permitida: `profileId null` + `guestToken` privado.
- Pago: `TRANSFERENCIA · PENDIENTE` (MP entra en Fase 6; nada simulado).
- Código público secuencial `TV-<año>-<número>`.

## 4c. Mis pedidos real — ✅

Server Component con sesión httpOnly: la clienta ve SOLO sus órdenes
(items, recorrido con historial, totales en centavos).

## Verificación end-to-end ejecutada (17-18/11)

Andamio temporal `/api/dev/test-checkout` (protegido con service key,
eliminado tras la prueba; artefactos: `scripts/inspect-checkout.ts`):

| Caso | Resultado esperado | Resultado real |
|---|---|---|
| Compra válida (1× Aurelia S) | Orden creada con snapshot, pago PENDIENTE, historial, reserva ACTIVA, stock S 2→1 | ✅ TV-2026-0001, todo verificado en DB |
| Compra > stock | Rechazo con cupos exactos | ✅ «Quedan 1 cupos…» |
| Producto inexistente | Rechazo | ✅ |
| Provincia inválida | Rechazo | ✅ |
| Reserva vencida | Sweep libera y devuelve stock | ✅ reserva LIBERADA, stock S 1→2 |
| Limpieza post-prueba | Base igual a antes | ✅ 0 pedidos, stock de seed |

Además: lint 0 · build ✓ · smoke rutas 200.

## Pendiente / decisiones abiertas

- `/perfil` (medidas guardadas) sigue sobre store demo → conectar en Fase 5
  con `measurement_versions` (historial append-only ya modelado).
- Favoritos y consultas (inquiries) → Fase 5/6.
- Imágenes: siguen placeholders elegantes hasta fotos reales o crédito de
  generación (ver `docs/BACKLOG.md`).
- Telas gestionables por la admin → backlog (aplicar al final del proyecto).
