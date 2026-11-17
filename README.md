# Venecia — Alta Costura

Plataforma web de e-commerce + backoffice para una boutique de vestidos de alta costura hechos a mano. Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zustand · Lucide React.

## Árbol del proyecto

```
WebApp_TiendaVenecia/
├─ package.json
├─ next.config.mjs
├─ tailwind.config.ts
├─ postcss.config.mjs
├─ tsconfig.json
├─ .env.example
├─ .gitignore
└─ src/
   ├─ app/
   │  ├─ layout.tsx                 # Layout raíz (fuentes Playfair Display + Jost, metadata)
   │  ├─ globals.css                # Design system: marfil #FAF9F6, carbón #1A1A1A, oro #C5A059
   │  ├─ (tienda)/
   │  │  ├─ layout.tsx              # Shell del storefront (TopBar + Header + Footer + CartDrawer)
   │  │  ├─ page.tsx                # Home editorial (hero, proceso artesanal, destacadas, a medida)
   │  │  ├─ coleccion/page.tsx      # Catálogo con filtros avanzados + vista rápida
   │  │  ├─ producto/[slug]/page.tsx# PDP: galería, talles, confección a medida, agregar al carrito
   │  │  ├─ carrito/page.tsx        # Carrito completo + notas para el taller
   │  │  ├─ checkout/page.tsx       # Checkout: envío, resumen y orden real para el panel admin
   │  │  ├─ mis-pedidos/page.tsx    # Seguimiento del vestido con línea de tiempo del taller
   │  │  └─ perfil/page.tsx         # Datos de la clienta + medidas guardadas
   │  ├─ login/
   │  │  └─ page.tsx                # Login real + accesos rápidos de rol para la demo
   │  └─ admin/
   │     ├─ layout.tsx              # GUARDA RBAC: /admin/* solo para rol ADMIN
   │     ├─ page.tsx                # Dashboard: KPIs, recientes, más vendidas, cupos críticos
   │     ├─ pedidos/page.tsx        # Tabla con filtros + cambio de estado en vivo + detalle
   │     ├─ prendas/page.tsx        # CRUD completo: crear, editar, pausar, eliminar
   │     └─ clientes/page.tsx       # Fichas: historial, total gastado, medidas, notas
   ├─ components/
   │  ├─ layout/
   │  │  ├─ TopBar.tsx              # Barra superior oscura con anuncios
   │  │  ├─ RoleSwitcher.tsx        # Selector rápido de rol (barra superior)
   │  │  ├─ Header.tsx              # Header sticky con logo, nav, carrito y cuenta
   │  │  ├─ AccountMenu.tsx         # Menú de cuenta (mis pedidos, perfil, panel)
   │  │  └─ Footer.tsx              # Footer editorial carbón con acentos oro
   │  ├─ store/
   │  │  ├─ CartDrawer.tsx          # Carrito deslizante con progreso de envío gratis
   │  │  ├─ ProductCard.tsx         # Tarjeta con badges de stock y vista rápida
   │  │  ├─ QuickViewModal.tsx      # Vista rápida con selector de talle
   │  │  ├─ MeasurementsForm.tsx    # Formulario de medidas (busto, cintura, cadera, largo)
   │  │  ├─ FeaturedCollection.tsx  # Destacadas del atelier para la home
   │  │  └─ NewsletterForm.tsx
   │  ├─ admin/
   │  │  ├─ AdminShell.tsx          # Sidebar carbón del backoffice con nav activa
   │  │  ├─ OrderDetailModal.tsx    # Detalle de pedido + actualizador de estado
   │  │  ├─ ProductFormModal.tsx    # Formulario completo de alta/edición de prendas
   │  │  └─ CustomerDetailModal.tsx # Ficha de clienta con notas editables
   │  └─ ui/
   │     ├─ Button.tsx              # Primitiva de botón (variantes primary/gold/outline…)
   │     └─ StatusBadge.tsx         # Chip de estado de pedido con punto de color
   ├─ data/
   │  └─ mock-data.ts               # Seed: usuarios, clientas, 8 vestidos, 5 pedidos
   ├─ lib/
   │  ├─ types.ts                   # Modelo de dominio completo (RBAC, prendas, pedidos…)
   │  ├─ constants.ts               # Estados del taller, categorías, telas, envío
   │  ├─ hooks.ts                   # useMounted (hidratación de stores persistidos)
   │  └─ utils.ts                   # cn, formatCurrency (ARS), fechas, ids, slugs
   ├─ services/
   │  └─ api.ts                     # Contrato DataService listo para Supabase/Prisma
   └─ store/                        # Zustand + persistencia en localStorage
      ├─ auth-store.ts              # Sesión, login real y cambio rápido de rol
      ├─ catalog-store.ts           # CRUD de prendas (consume el backoffice)
      ├─ customers-store.ts         # Clientas, notas y medidas guardadas
      ├─ orders-store.ts            # Pedidos: crear (checkout) y actualizar estado (admin)
      └─ cart-store.ts              # Carrito con variantes a medida + drawer
```

## Roles (RBAC)

| Rol | Acceso |
|---|---|
| `CLIENTE` | Storefront, carrito, checkout, mis pedidos, perfil, confección a medida |
| `ADMIN` | Todo lo anterior + panel del atelier (`/admin/*`, protegido con guarda en el layout) |

- **Login real:** `admin@venecia.com / venecia2024` · `valentina@example.com / cliente123`
- **Selector rápido de rol:** en la barra superior negra ("Invitada / Nombre · Rol"), pensado para probar ambos paneles sin cerrar sesión.

## Estados del pedido (taller)

`Pendiente → En corte y confección → Control de calidad → Enviado → Entregado`

El admin actualiza el estado y el historial se registra con fecha; se refleja en "Mis Pedidos" del cliente (mismo store, persistencia compartida en localStorage).

## Roadmap de fases

- **Fase 1 (completa):** estructura, tipos, stores con seed de alta costura, design system, layout editorial y sistema de roles.
- **Fase 2 (completa):** storefront completo — catálogo con filtros (talle, tela, ocasión, precio, disponibilidad), vista rápida, PDP con talle estándar + confección a medida (busto/cintura/cadera/largo), carrito deslizante, checkout con notas para el taller y "Mis Pedidos" con seguimiento.
- **Fase 3 (completa):** backoffice — dashboard de KPIs, CRUD de prendas, gestión de pedidos con cambio de estado en vivo y gestión de clientas con historial, total gastado, medidas y notas privadas del atelier.

## Puesta en marcha

```bash
npm install
npm run dev
# http://localhost:3000
```

La app es 100% interactiva sin base de datos: los stores de Zustand se autosembraron con datos mock realistas y persisten en `localStorage`. Para producción, conectar la capa `src/services/api.ts` a Supabase o Prisma/PostgreSQL (ver el contrato `DataService` con el ejemplo de intercambio en ese archivo).
