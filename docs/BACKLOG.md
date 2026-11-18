# Backlog de cambios pedidos por la boutique

Cambios pedidos durante el desarrollo que se aplican al finalizar el
proyecto completo, para no romper flujos ya verificados. Cada ítem se
cierra cuando se implementa y verifica.

## 1. Telas gestionables desde el panel (pedido: 18/11, Fase 4)

**Estado actual:** la lista de telas está hardcodeada en
`src/lib/constants.ts` (`FABRICS`) y se usa en:
- `ProductFormModal` (selector de telas de la prenda)
- Filtros de `/coleccion` (faceta "telas")
- Fichas de producto

**Pedido:** la administradora carga los tipos de telas disponibles
(alta/edición/archivo desde el panel), y los formularios y filtros
leen de esa lista.

**Plan de implementación (cuando el proyecto esté completo):**
1. Migración: tabla `fabrics` (id, nombre único, descripción?, isDemo, archived) + tabla puente `product_fabrics` (productId, fabricId) — o conservar `products.fabrics String[]` y una tabla de catálogo de telas que la valida.
   - Decisión recomendada: tabla `fabrics` + seguir usando `products.fabrics` como snapshot de nombres (mantiene snapshots de pedidos intactos y evita reescribir order_items).
2. Server actions admin: `saveFabric`, `archiveFabric` (nunca borrar si hay prendas que la usan → archivo).
3. Panel: sección "Telas" en el admin + selector del ProductFormModal lee de la base (server component le pasa la lista).
4. Filtros de `/coleccion`: faceta dinámica desde la base.
5. Seed: telas demo etiquetadas `isDemo` (las actuales del array).

**Cuidado al aplicar:** no romper `saveProduct` (valida `fabrics.min(1)`),
filtros de colección y snapshots de pedidos (guardan texto, no referencias).

## 2. Borrado completo de la demo (pedido: 17/11, Fase 3)

La boutique pidió dejar 2 ejemplos por sección (hecho) y después
borrarlos por completo. Aplicar cuando el contenido real esté cargado:
- `npm run db:seed:clean` (base) + vaciar `src/data/mock-data.ts` de
  ejemplos + cuentas demo (admin@venecia.com, valentina@demo.venecia)
  desde Authentication → Users de Supabase.
- Confirmar con la boutique antes de borrar (acción irreversible sobre
  datos de prueba, no comerciales).
