# Fase 3 - Admin real (en progreso)

## Criterios de aceptación (de `docs/AUDITORIA-FASE-0.md`)

> Autorización server-side, CRUD de catálogo/variantes/imágenes, CMS ligero,
> calendario interno, PDF. Alta/edición/archivo persiste; archivo en vez de
> borrado cuando hay historial.

## 3a. Auth real — ✅ (17/11)

- **Login + registro reales** (`/login`): Supabase Auth con confirmación por email, errores traducidos, `?next=` respetado. Sin accesos demo ni selector de roles (se eliminó `RoleSwitcher`: era un agujero de la demo).
- **Puente de sesión** (`src/lib/auth/session-bridge.ts`): la sesión real (cookies httpOnly) alimenta al store que consumían Header/perfil/admin. El **rol siempre se lee de `profiles`**, nunca del navegador.
- **Promoción a ADMIN** (`scripts/promote-admin.ts <email>`): verifica cuenta, perfil del trigger y rol; idempotente.
- Guardias en capas: `proxy.ts` (server, cookies) + `requireAdmin`/`assertAdmin` (`src/server/admin/guard.ts`) en cada Server Component/Action + AdminLayout (cliente, reflejo).
- Cuenta de la boutique promovida: `kvnrenott@gmail.com` (ADMIN). Cambiar la contraseña demo de `admin@venecia.com` queda pendiente de la boutique.

## 3b. Panel sobre datos REALES — ✅ (17/11)

Arquitectura: Server Components consultan Prisma en el servidor; las mutaciones son **server actions** que validan con Zod, exigen `assertAdmin()` y revalidan rutas.

| Sección | Datos | Acciones server-side |
|---|---|---|
| Dashboard | `src/server/admin/stats.ts` (agregados en centavos; CANCELADO no factura) | — |
| Prendas | `products.ts` (variantes→stock, imágenes por posición) | `saveProduct` (alta/edición transaccional), `setProductStatus` (PUBLICADO⇄PAUSADO), `archiveProduct` (**archivo, nunca borra**) |
| Pedidos | `orders.ts` (items con snapshots, historial, pagos) | `updateOrderStatus` (valida contra `ORDER_TRANSITIONS` y registra `order_status_history` con quién/cuándo/nota) |
| Clientas | `customers.ts` (perfiles + email de `auth.users` por SQL + medidas + métricas) | `updateCustomerContact` (teléfono; el rol jamás se toca) |

Reglas de dominio custodiadas por el servidor:
- Dinero en centavos enteros (`toCents`/`formatCents`), jamás float.
- Archivo en vez de borrado: ARCHIVADO sale de gestión y storefront; pedidos/reseñas sobreviven con snapshots.
- Máquina de estados: el select de "Pasar a…" solo ofrece transiciones legales y el servidor las revalida igual.

### Verificación ejecutada

- `scripts/verify-admin-data.ts`: 2 prendas demo, 0 pedidos, 3 perfiles con email correcto, `kvnrenott@gmail.com` = ADMIN. ✅
- Lint 0 errores · build ✓ · smoke 8 rutas 200 + `/admin` sin sesión → 307. ✅
- Falta: revisión visual de la boutique en su navegador (sesión real).

## Demo reducida (pedido de la boutique, 17/11)

- `src/data/mock-data.ts`: 2 clientas, 2 pedidos, 2 prendas (mock).
- `prisma/seed.ts`: 2 prendas demo en la base (`db:seed:clean` + `db:seed` re-ejecutados).
- El borrado completo de la demo se hará cuando la boutique lo pida.

## Pendiente de la fase

- CMS ligero + calendario interno + PDF (fin de fase).
- `mis-pedidos`/`perfil` de clientas siguen sobre stores demo → Fase 4.
- Storefront (`/coleccion`, ficha) todavía lee el mock → Fase 4 conecta a la base.
