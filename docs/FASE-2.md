# Fase 2 - Rediseño visual y accesibilidad (completada)

## Criterios de aceptación (de `docs/AUDITORIA-FASE-0.md`)

> Rediseño integral tienda/admin sobre tokens, estados de carga/vacío/error,
> accesibilidad teclado, `prefers-reduced-motion`.
> Navegación y checkout operables por teclado y móvil.

## 2a. Sistema de diseño — ✅

- **Tokens** (`tailwind.config.ts`): paleta identidad (marfil/oro/carbón) + colores semánticos de estado en tono atelier (`success`, `error`, `warn`).
- **Foco de teclado**: `:focus-visible` con anillo oro global (navegación, formularios, botones, tarjetas).
- **`prefers-reduced-motion`**: media query que neutraliza animaciones/transiciones.
- **Skip-link** "Saltar al contenido" en tienda y admin, con `<main id>` enfocable.
- **Componentes de estado** (`src/components/ui/`):
  - `Skeleton.tsx` — shimmer sin saltos de layout + `ProductCardSkeleton`.
  - `EmptyState.tsx` — pantalla vacía estándar con icono, texto y acción.
  - `ErrorNotice.tsx` — `role="alert"`, el color nunca es el único portador.
  - `Button.tsx` — estado de carga (`isLoading`, `aria-busy`, spinner).
- **Globales** (`globals.css`): `.skeleton` (shimmer), `.form-error`, `.skip-link`.

## 2b. Tienda — ✅

- **Hero tipográfico editorial** (radiales oro sobre charcoal + "VENECIA" gigante) en vez de foto placeholder.
- **`ProductImage.tsx`**: imagen con fallback elegante si el archivo no existe. Nunca ícono roto ni foto aleatoria.
- **Convención de imágenes**: `/images/products/<slug>-<n>.jpg` en mock-data, seed de Prisma, modal de admin y todas las vistas. Cuando exista la foto, la web la usa sin cambios de código.
- Login y sección "Confección a medida" con paneles de atelier (huecos comentados para las fotos reales).
- Imágenes demo generables (11 prompts listos: hero, atelier, login, 8 prendas) — pendiente de crédito en OpenCode o fotos reales de la boutique.

## 2c. Estados de carga/vacío/error — ✅

- Esqueletos en hidratación de: `mis-pedidos`, `perfil`, y las 4 páginas de admin (antes: divs en blanco).
- Estados vacíos con acción ya existentes verificados (colección sin resultados con "quitar filtros", mis-pedidos con CTA a la colección, admin dashboard).
- Colección no tiene flash de hidratación (catálogo no persiste en localStorage).

## 2d. Admin — ✅

- `AdminShell`: skip-link propio, `aria-label` en las dos navegaciones, `aria-current="page"` en el ítem activo (escritorio y mobile), `<main id="contenido-admin">` enfocable.
- Guardia con estado de carga elegante ("Verificando acceso al atelier…").

## 2e. Verificación — ✅

| Prueba | Resultado |
|---|---|
| `npm run lint` | 0 errores |
| `npm run build` (Turbopack) | ✓ Compiled successfully |
| Smoke test producción | `/`, `/coleccion`, `/login`, `/producto/vestido-aurelia`, `/carrito`, `/checkout`, `/mis-pedidos`, `/perfil`, `/admin` → todos HTTP 200 |

## Notas

- La identidad (marfil/oro/carbón, Playfair + Jost) se conservó como base, según lo acordado en la auditoría.
- El rediseño trabajó sobre tokens y componentes compartidos; los componentes de estado se reutilizan en las fases siguientes (3 y 4) cuando las pantallas pasen a datos reales con sus cargas genuinas.
