# Backlog de cambios pedidos por la boutique

Cambios pedidos durante el desarrollo. Cada ítem se cierra cuando se
implementa y verifica.

## 1. ✅ Telas gestionables desde el panel (pedido: 18/11 · INTEGRADO: 18/11)

**Estado: HECHO.** Migración `fabrics` (20261118011300) + sección
`/admin/telas` en el panel (nombre único e inmutable tras crear para no
romper referencias, descripción editable, archivo en vez de borrado,
etiqueta demo). Selector del formulario de prendas y faceta de filtros de
`/coleccion` leen de la base. Seed: 8 telas demo (isDemo, limpiables).
Verificado: seed ✓, RLS lectura pública ✓ (anon REST), `/coleccion`
renderiza faceta ✓, `/admin/telas` con sesión real (payload con las 8
telas y contador de uso) ✓. Acciones con `assertAdmin` + Zod.

**Nota de diseño a futuro:** si algún día se quiere poder RENOMBRAR una
tela, hay que migrar las referencias (products.fabrics String[]) en la
misma transacción. Hoy el nombre es inmutable por integridad.

## 2. ⏳ Borrado completo de la demo (pedido: 17/11 · pendiente al final)

La boutique pidió dejar 2 ejemplos por sección (hecho) y después borrarlos
por completo. Aplicar cuando el contenido real esté cargado:
- `npm run db:seed:clean` (base, incluye telas demo) + vaciar
  `src/data/mock-data.ts` + cuentas demo (admin@venecia.com,
  valentina@demo.venecia) desde Authentication → Users de Supabase.
- Confirmar con la boutique antes de borrar (irreversible sobre datos de
  prueba, no comerciales).

## 3. ⏳ Mercado Pago real (credenciales sandbox, pedido: 18/11)

La integración está completa y verificada en su núcleo (webhook firmado,
idempotente, pendiente no marca pagado). Falta: `MP_ACCESS_TOKEN`,
`MP_WEBHOOK_SECRET`, `MP_WEBHOOK_BASE_URL` en .env + prueba de compra
sandbox real. La boutique lo pidió para "más tarde".
