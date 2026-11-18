# Fase 6 - Integraciones (completada en su núcleo)

## Criterios de aceptación (de `docs/AUDITORIA-FASE-0.md`)

> MP sandbox (webhook verificado, idempotente), transferencias con
> verificación manual, email transaccional, adaptador de envío manual.
> Webhook duplicado no duplica cobro ni decremento de stock; comprobante
> no marca "pagado" automáticamente.

## Verificación E2E ejecutada (18/11) — ✅ todos los criterios

Andamio temporal (`/api/dev/test-fase6`, eliminado tras la prueba) que
ejercitó el núcleo real del webhook con una orden de prueba real:

| Prueba | Resultado |
|---|---|
| Webhook con pago aprobado → pago `VERIFICADO`, `mpPaymentId` guardado, pedido `VERIFICADO`, reserva `CONSUMIDA`, stock descontado UNA vez (2→1 en checkout, sin segundo descuento) | ✅ |
| **Webhook DUPLICADO** → `duplicate: true`, cero efectos adicionales (ni cobro ni stock) | ✅ |
| Pago `pending` de MP → registrado (`mpPaymentId`) PERO **sin transición**: pedido sigue `PENDIENTE`, reserva sigue `ACTIVA`, sin `verifiedAt` | ✅ |
| Webhook real sin firma `x-signature` → **401 fail-closed** | ✅ |
| Limpieza → base sin rastro, stock restaurado | ✅ |

## Qué quedó implementado

### Mercado Pago (`src/server/integrations/mercadopago.ts`)

- `isMercadoPagoConfigured()`: sin `MP_ACCESS_TOKEN`, el checkout ofrece
  **solo transferencia** (nada simulado).
- `createMercadoPagoPreference`: preferencia con ítems desde la base
  (centavos → ARS), `external_reference` = id interno del pago
  (el vínculo del webhook) y `notification_url` del webhook público.
- `fetchMercadoPagoPayment`: el webhook **relee el pago contra la API de
  MP**; el cuerpo del POST nunca es fuente de verdad.
- Checkout: selector de método (transferencia siempre; MP si está activo).
  Con MP, `placeOrder` devuelve `initPoint` y la clienta es redirigida;
  si la preferencia falla, el pedido queda respaldado con transferencia.
- Webhook (`/api/webhooks/mercadopago`): firma HMAC-SHA256 verificada
  (`MP_WEBHOOK_SECRET`, comparación constante, 401 sin secreto/firma).

### Núcleo idempotente (`src/server/store/payments.ts`)

- Doble idempotencia: `mpPaymentId` unique en la base + re-chequeo de estado.
- Estados legales por máquina de pagos; `approved → VERIFICADO`,
  `rejected/cancelled → RECHAZADO`, `pending` sin transición.
- Reservas del pedido → `CONSUMIDA` al aprobarse; si la reserva venció
  (ventana de 30 min), reintenta el stock y, si no alcanza, **queda anotado
  para decisión humana** (la plata es real, no se devuelve sola).
- El barrido de vencidas ahora respeta pedidos ya verificados.

### Email transaccional (`src/server/integrations/email.ts`)

- Plantillas AR/es reales: confirmación de pedido, propuesta de presupuesto,
  pago verificado (con saldo).
- **Stub honesto**: sin proveedor, registra el mensaje con marca
  `[EMAIL-STUB]` y reporta `delivered: false` — nunca finge un envío.
  Cableado en los tres momentos del flujo.
- Activación: `EMAIL_PROVIDER_URL` + `EMAIL_PROVIDER_API_KEY` (.env.example
  actualizado); el único bloque pendiente es el POST de `deliver`.

### Envío manual (adaptador)

- `quoteShipping(orderId, shippingArs)`: `A_COTIZAR → COTIZADO` con recálculo
  del total en centavos (subtotal − descuento + envío).
- `advanceShipping(orderId, EN_CAMINO|ENTREGADO)`: transiciones validadas
  (`SHIPPING_TRANSITIONS`); al entregar, el pedido pasa a `ENTREGADO` con
  historial (si la transición del pedido lo permite).
- Reservas: creadas ligadas al pedido (`orderId`) desde el checkout.

## Pendiente de la boutique para activar de verdad

1. **Mercado Pago sandbox**: crear app en
   [developers.mercadopago.com.ar](https://www.mercadopago.com.ar/developers/panel/app),
   cargar en `.env`:
   - `MP_ACCESS_TOKEN` (token de prueba de la app)
   - `MP_WEBHOOK_SECRET` (Cuenta > Integraciones > Webhook secret)
   - `MP_WEBHOOK_BASE_URL` (URL pública; en local, con un túnel tipo ngrok)
   Con eso: el checkout muestra MP, hago la prueba de compra sandbox real
   y verifico firma + webhook de punta a punta.
2. **Email**: elegir proveedor (Resend/Brevo/SMTP) y cargar credenciales.
3. **Transferencias con verificación manual**: ya operativo desde Fase 5.

## Notas técnicas

- El webhook responde 200 a MP ante payloads bien firmados aunque el
  procesamiento interno falle (evita tormenta de reintentos); todo queda
  logueado para revisión.
- `mpPaymentId` es `String?` en la base: MP devuelve numérico; se
  normaliza a string para el unique.
- Próxima compra MP real: `placeOrder` → preferencia → pago → webhook →
  pago `VERIFICADO` + email de saldo, sin intervención manual.
