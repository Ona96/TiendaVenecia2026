# Venecia — Alta Costura

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=flat-square&logo=tailwindcss&logoColor=black)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=black)](https://supabase.com)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev)

Plataforma web para una boutique de vestidos de alta costura hechos a mano en Posadas, Misiones (Argentina): **tienda online + backoffice del taller** en una sola aplicación. Es un proyecto freelance real, pensado para producción: datos en base de datos, autenticación real, pagos por transferencia y un flujo completo de pedido con seguimiento del taller.

Desarrollado por [Kevin Otto](https://github.com/Ona96) · Precios en ARS · Interfaz completa en español.

## Características

### Tienda (storefront)

- **Home editorial** con colección destacada, proceso artesanal y newsletter.
- **Catálogo** de prendas publicadas con filtros por tela (las telas se gestionan desde el panel, la faceta se arma sola).
- **Ficha de producto** con galería, talles estándar y **confección a medida** (busto/cintura/cadera/largo), datos estructurados `schema.org/Product` y metadatos dinámicos.
- **Carrito** deslizante con notas para el taller y progreso de envío gratis (flat $3.500 ARS, gratis desde $150.000 ARS).
- **Checkout real**: precios y totales se recalculan siempre en el servidor, en centavos. Compra como clienta registrada **o como invitada** (con token de acceso privado al pedido).
- **Reserva de stock con vencimiento a 30 minutos**: el stock se decrementa al confirmar y se libera solo si la reserva vence (sin cron: se barre al iniciar cada checkout y desde el panel).
- **Mis pedidos** con línea de tiempo del taller (cada cambio de estado queda registrado con fecha y quién lo hizo).
- **Presupuestos de confección especial**: la clienta pide un presupuesto (también sin cuenta), el taller arma versiones con ítems y validez, y la aceptación por web queda auditada.
- **Perfil** con datos de la cuenta y **medidas versionadas** (append-only: cada carga es una versión nueva, nunca se pisa la anterior).

### Backoffice (`/admin`, solo rol ADMIN)

- **Dashboard** con KPIs reales: ingresos (sin contar cancelados), pedidos en el taller, prendas publicadas, clientas registradas, más vendidas y cupos de stock críticos.
- **Pedidos**: tabla con filtros, cambio de estado validado contra la máquina de estados, registro de señas por transferencia con verificación en dos pasos, cotización y avance del envío.
- **Prendas**: alta/edición transaccional con slug único, talles con stock, imágenes subidas a Supabase Storage, pausar/publicar y **archivado** (nunca se borra: los pedidos viejos conservan su snapshot).
- **Telas**: catálogo con nombre único e inmutable tras crear, descripción editable y archivado.
- **Presupuestos**: versionado inmutable (cada propuesta es una versión nueva con validez), estados de gestión y aceptación web visible.
- **Clientas**: fichas con email, teléfono editable, medidas vigentes, historial de pedidos y total gastado. El rol no se toca desde el panel.

### Del lado del servidor

- **Modelo de datos con 23 modelos y 13 enums** (Prisma + PostgreSQL): snapshots inmutables de pedido, dinero en centavos enteros (jamás `float`), archivado en lugar de borrado y auditoría de estados.
- **Seguridad en capas**: `proxy.ts` protege `/admin/*` (Next 16: reemplaza a `middleware.ts`), cada página del panel exige sesión ADMIN, cada Server Action valida con `assertAdmin()` y **el rol siempre se lee de la tabla `profiles` en la base, nunca del token ni del navegador**. En la base: RLS activa en todas las tablas de dominio + trigger anti-escalada (una clienta no puede auto-promoverse a ADMIN).
- **Máquinas de estado explícitas** para pedido, pago y envío; el comprobante de transferencia nunca verifica un pago por sí solo.
- **Mercado Pago integrado** (preferencias + webhook con firma HMAC verificada e idempotencia doble) a la espera de credenciales de la boutique: sin token configurado, el checkout ofrece **solo transferencia, nada simulado**.
- **Email transaccional con stub honesto**: sin proveedor configurado, los emails se registran y se reportan como "no enviados" (jamás se finge un envío).
- **SEO**: sitemap dinámico (una URL por prenda publicada) y `robots.txt` que excluye las áreas privadas.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, `proxy.ts`) · React 19 |
| Lenguaje | TypeScript (estricto) |
| Estilos | Tailwind CSS 3 (design system marfil/carbón/oro, Playfair Display + Jost) |
| Base de datos | PostgreSQL (Supabase) vía Prisma 6, con RLS y Storage |
| Autenticación | Supabase Auth (email + contraseña, cookies httpOnly vía `@supabase/ssr`) |
| Estado cliente | Zustand (solo carrito en localStorage + puente de sesión) |
| Validación | Zod en cada Server Action |
| Tests | Vitest (14 unitarios sin base + 9 de integración contra la base) |

## Puesta en marcha

Requisitos: Node.js (en desarrollo se usó Node 26), una cuenta de [Supabase](https://supabase.com) y acceso a su conexión PostgreSQL.

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar el entorno
cp .env.example .env
# Completar: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL y DIRECT_URL (Supabase > Project Settings)

# 3. Aplicar migraciones (crea tablas, RLS, triggers y el bucket de imágenes)
npm run db:deploy

# 4. Crear la primera ADMIN
#    a) registrate desde /login con tu email real
#    b) promové la cuenta:
npx tsx scripts/promote-admin.ts tu-email@ejemplo.com

# 5. Levantar la app
npm run dev
# http://localhost:3000
```

Opcional, solo en una **base de desarrollo**: `npm run db:seed` carga datos de demo marcados con `isDemo` (2 prendas, 6 categorías, 8 telas, 3 colecciones, CMS y una promoción) y `npm run db:seed:clean` los borra sin tocar datos reales. La base de producción quedó limpia de demo.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run lint` | ESLint 9 (flat config) |
| `npm test` | Tests unitarios (sin base) |
| `npm run test:db` | Tests unitarios + de integración contra la base de **desarrollo** (en serie) |
| `npm run db:migrate` | Migraciones en desarrollo |
| `npm run db:deploy` | Aplicar migraciones (activación/producción) |
| `npm run db:seed` / `db:seed:clean` | Cargar / borrar la demo (`isDemo`) |
| `npm run verify:supabase` | Verificación E2E de la activación Supabase (auth, trigger, RLS) |
| `npm run db:studio` | Prisma Studio |

## Variables de entorno

Ver `.env.example` (comentado en detalle). Resumen:

| Grupo | Variables | Sin configurar… |
|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo servidor) | la app degrada a modo demo explícito |
| PostgreSQL | `DATABASE_URL`, `DIRECT_URL` | no hay base |
| Mercado Pago | `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_WEBHOOK_BASE_URL` | el checkout ofrece solo transferencia (nada simulado) |
| Email | `EMAIL_PROVIDER_URL`, `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM` | stub que registra y reporta "no enviado" |
| Publicación | `NEXT_PUBLIC_SITE_URL` | sitemap/robots/OG asumen localhost |

## Tests

- **Unitarios** (`npm test`): dinero en centavos sin `float` y máquinas de estado (transiciones legales, saltos ilegales rechazados, estados finales sin salida).
- **Integración** (`npm run test:db`): checkout con precios desde la base, snapshot inmutable de ítems y medidas, stock con reserva y vencimiento, idempotencia del webhook de Mercado Pago. Requiere una base de desarrollo con el seed cargado; **no correr contra producción**.

## Estado del proyecto

- **Demo eliminada** (nov. 2026): la base quedó sin datos `isDemo`, sin cuentas de prueba y con el catálogo listo para que la boutique cargue prendas reales desde el panel. Build de producción verificado con catálogo vacío.
- **Pendientes que dependen de la boutique** (detalle en [`docs/PENDIENTES-BOUTIQUE.md`](docs/PENDIENTES-BOUTIQUE.md)): fotos y catálogo real, credenciales de Mercado Pago (sandbox primero), proveedor de email, revisión legal de los borradores de términos/privacidad y despliegue (pendiente de autorización; recomendado Vercel).
- El proceso completo de reconversión (desde la demo original hasta la app real) está documentado fase por fase en [`docs/`](docs/): auditoría inicial (FASE-0) y las fases 1 a 8 con criterios de aceptación y verificaciones E2E.

## Estructura

```
src/
├─ proxy.ts                      # Protección server-side de /admin (Next 16)
├─ app/
│  ├─ (tienda)/                  # Storefront: home, colección, producto, carrito,
│  │                             #   checkout, mis-pedidos, mis-presupuestos,
│  │                             #   presupuesto, perfil, términos, privacidad
│  ├─ admin/                     # Backoffice: dashboard, pedidos, prendas, telas,
│  │                             #   presupuestos, clientas
│  ├─ api/webhooks/mercadopago/  # Webhook firmado e idempotente
│  ├─ login/                     # Login + registro (Supabase Auth)
│  └─ sitemap.ts · robots.ts · not-found.tsx
├─ components/                   # layout · store · admin · auth · ui
├─ domain/state-machines.ts      # Máquinas de estado de pedido/pago/envío
├─ lib/                          # env, money, storage, supabase, validación Zod
├─ server/                       # Server Components/Actions: admin y tienda,
│                                #   guardas RBAC e integraciones (MP, email)
└─ store/                        # Zustand: carrito (localStorage) y sesión
prisma/                          # schema, migraciones (RLS incluida) y seeds
scripts/                         # promote-admin, verify-*, inspect-checkout…
tests/                           # unit/ (sin base) + integration/ (con base)
docs/                            # Auditoría, fases 1-8, backlog y pendientes
```

---

*Proyecto de desarrollo a medida para una boutique real. Publicado con fines de portfolio; los textos y datos comerciales le pertenecen a la clienta.*
