# Venecia — Informe de Auditoría (Fase 0)

**Fecha:** 16/11/2026 · **Alcance:** repositorio local `D:\WebApp_TiendaVenecia`
**Estado:** demo local. NO apta para producción. Sin base de datos, sin backend real, sin despliegue.

---

## 1. Diagnóstico respaldado por archivos

### Herramientas y entorno
| Ítem | Evidencia | Resultado |
|---|---|---|
| Node / npm | `node -v`, `npm -v` | Node v26.13.1 · npm 12.2.2 |
| Framework | `package.json` | Next.js `^14.2.35` (parcheado, sin vulnerabilidad conocida), React 18.3, TS 5.6, Tailwind 3.4, Zustand 4.5 |
| Lockfile | `package-lock.json` | Presente, instalación reproducible |
| Build + typecheck | `npm run build` | ✅ Compila: 13 rutas, 0 errores de tipos |
| Lint | `npm run lint` | ❌ **ESLint sin configurar** (prompt interactivo, falla en CI) |
| Tests | búsqueda en repo | ❌ No existen |
| Control de versiones | `git status` | ❌ No era repositorio Git → **creado en esta auditoría** con commit baseline (punto de recuperación) |
| Variables de entorno | `.env.example` | Solo placeholders documentados; sin secretos (correcto) |
| Carpeta `public/` | inspección raíz | ❌ No existe; todas las fotos son remotos de picsum.photos (`src/data/mock-data.ts`) |

### Rutas existentes (13)
- Tienda: `/`, `/coleccion`, `/producto/[slug]`, `/carrito`, `/checkout`, `/mis-pedidos`, `/perfil`
- Panel: `/admin`, `/admin/pedidos`, `/admin/prendas`, `/admin/clientes`
- Acceso: `/login`

---

## 2. Mapa: construido vs simulado

### Real (funciona hoy, solo local)
| Funcionalidad | Archivos |
|---|---|
| UI editorial tienda + panel (responsive básico) | `src/app/(tienda)/*`, `src/app/admin/*`, `src/components/*` |
| Catálogo con filtros y vista rápida | `src/app/(tienda)/coleccion/page.tsx` |
| PDP con talle estándar + confección a medida | `src/app/(tienda)/producto/[slug]/page.tsx` |
| Carrito drawer + página + checkout | `src/components/store/CartDrawer.tsx`, `src/app/(tienda)/carrito/page.tsx`, `src/app/(tienda)/checkout/page.tsx` |
| CRUD catálogo / pedidos / clientes en admin | `src/app/admin/*`, `src/components/admin/*` |
| "Mis pedidos" con línea de tiempo | `src/app/(tienda)/mis-pedidos/page.tsx` |
| Persistencia local con seed mock | `src/store/*`, `src/data/mock-data.ts` |

### Simulado (parece real pero no lo es)
| Simulación | Riesgo | Evidencia |
|---|---|---|
| "Base de datos" = `localStorage` | Cada navegador tiene su propia copia; se resetea al seed al borrar caché | `src/store/*.ts` (persist middleware) |
| Login "real" | Contraseñas mock en texto plano; sin servidor ni hashing | `src/data/mock-data.ts` (seedUsers), `src/store/auth-store.ts` |
| Protección `/admin` | Solo `useEffect` en cliente → **bypaseable** por cualquier visitante con devtools | `src/app/admin/layout.tsx` |
| Totales del checkout | Calculados en el navegador, no validados en servidor | `src/app/(tienda)/checkout/page.tsx` |
| Estados de pedido | Mutados en cliente sin máquina de estados ni auditoría server | `src/store/orders-store.ts` |

### Ausente (nunca existió)
- API/Route Handlers: no hay `src/app/api/`.
- Middleware (`middleware.ts`): inexistente.
- DB, ORM, migraciones, seed idempotente: inexistente.
- Pagos (Mercado Pago o transferencia con verificación): inexistente.
- Envíos (cotización o proveedor), email transaccional: inexistentes.
- Precios con exactitud monetaria: hoy son `number` float (`src/lib/types.ts`) — en producción contable debe migrarse a centavos enteros (`Int`).
- Favoritos, comparador, reseñas, presupuestos, PDF, CMS: inexistentes (son alcance nuevo del prompt maestro).
- SEO (sitemap, robots, schema.org): inexistente.
- `DataService`: **existe** (`src/services/api.ts:24-30`) pero **ningún store lo usa**; es contrato documentativo útil como guía de intercambio, no una capa funcional.

---

## 3. Propuesta técnica comparada

| Decisión | Opción A (recomendada) | Opción B | Por qué |
|---|---|---|---|
| **DB** | **Supabase** (PostgreSQL hosted + Storage + Auth) | PostgreSQL local + Prisma (o SQLite) | Postgres real gratis en tier inicial, Storage para fotos, Auth con email/Google, RLS para seguridad server-side. La alternativa exige instalar/mantener Postgres en la máquina de la boutique; SQLite no soporta bien concurrencia de reservas de stock ni deploy multi-instancia. |
| **Acceso a datos** | Server Actions + Route Handlers con queries directas (Prisma u `postgres.js`) | DataService sobre fetch a `/api/*` | Menos capa HTTP innecesaria; el contrato `DataService` se conserva como interfaz de repositorio si resulta útil. |
| **Auth** | Supabase Auth (email/contraseña ya; **Google solo cuando haya credenciales reales**) | Auth.js | Sesiones httpOnly nativas, recuperación de contraseña, límite de intentos; un único rol `ADMIN` en tabla `profiles`. No se escribe criptografía casera. |
| **Dinero** | Centavos enteros (`Int`) + snapshot en cada orden | decimal(12,2) | Elimina errores de float en contabilidad y comparaciones. |
| **Pagos** | Adaptador server-side: Mercado Pago (Preferences + webhook con verificación de firma según doc oficial) + flujo manual de transferencia | — | MP en **sandbox/stub claramente señalado** hasta tener credenciales. La redirección nunca confirma pago. |
| **Email** | Adaptador (SMTP de la boutique o Resend) con stub marcado | — | Se activa al configurar credenciales. |
| **Framework** | Mantener Next.js 14 App Router + TS + Tailwind | Migrar a Next 15 | La auditoría confirma que es adecuado; el upgrade a 15 es opcional y postergable. |

**Rediseño visual:** las decisiones estéticas existentes (marfil/oro/carbón, serif+sans) coinciden con la identidad pedida y se conservan como base; el rediseño integral de la Fase 2 trabaja sobre tokens, no contra el código.

---

## 4. Plan de fases (ajustado a lo auditado)

| Fase | Contenido | Criterios de aceptación clave |
|---|---|---|
| **0 (hecha)** | Auditoría + Git + informe | Este documento; build OK |
| **1. Fundaciones** | Decisión de DB aprobada → esquema (products, variants, orders, order_items, payments, customers, addresses, measurements, quotes), migraciones, auth real, seed etiquetado `DEMO`, `.env` sin secretos | CRUD persiste tras reiniciar servidor; usuario común no accede a admin ni a datos ajenos |
| **2. Diseño** | Rediseño integral tienda/admin, estados de carga/vacío/error, accesibilidad teclado, `prefers-reduced-motion` | Navegación y checkout operables por teclado y móvil |
| **3. Admin real** | Autorización server-side, CRUD de catálogo/variantes/imágenes, CMS ligero, calendario interno, PDF | Alta/edición/archivo persiste; archivo en vez de borrado cuando hay historial |
| **4. Comercial** | Catálogo conectado a DB, búsqueda, carrito con validación server, checkout, órdenes con snapshots, **reservas de stock con expiración** | Dos compradores por última unidad nunca venden stock inexistente; reserva expira y libera |
| **5. Especiales** | Medidas versionadas, presupuestos versionados, confección ligera (pruebas/arreglos), señas y saldos | Medidas modificadas después de la compra no alteran el snapshot del pedido |
| **6. Integraciones** | MP sandbox (webhook verificado, idempotente), transferencias con verificación manual, email transaccional, adaptador de envío manual | Webhook duplicado no duplica cobro ni decremento de stock; comprobante no marca "pagado" automáticamente |
| **7. Calidad** | Tests (unit/integración/e2e según corresponda), lint configurado, a11y, rendimiento | Suite pasa; lint con errores en 0 |
| **8. Pre-producción** | Checklist, contenido real, políticas legales, despliegue **solo con autorización** | Sin datos demo expuestos como reales |

---

## 5. Riesgos y bloqueos

1. **Elección de DB es la única decisión bloqueante de la Fase 1** → requiere aprobación del usuario (cuenta Supabase gratuita o Postgres local).
2. Precios float actuales → migración de unidad monetaria al diseñar el esquema (sin costo ahora, costoso después).
3. Sin credenciales reales (Google, MP, email, banco): se implementan adaptadores + modo sandbox **marcado**, nunca se declara integración operativa.
4. Fotos reales escasas → la UI debe funcionar con 1 foto o catálogo vacío; seeds demo siempre etiquetados y limpiables.
5. Reglas de impuestos/facturación ARS y políticas de devolución → a validar con el negocio antes de producción (Fase 8).

## 6. Primeras acciones ejecutadas en esta fase
- Git inicializado + commit baseline (punto de recuperación).
- `npm run build` verificado (OK) y `npm run lint` verificado (falla documentada).
- Este informe persistido en `docs/AUDITORIA-FASE-0.md`.
