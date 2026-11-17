# Fase 1 — Fundaciones (en progreso)

**Estado:** 1a completada (código base). **1b bloqueada por credenciales**: falta que la boutique cree el proyecto Supabase.

## Qué se implementó en 1a

| Pieza | Archivo | Notas |
|---|---|---|
| Esquema de dominio completo | `prisma/schema.prisma` | 20 modelos: catálogo, variantes por talle con stock, órdenes con snapshots, pagos, reservas de stock con expiración, presupuestos versionados, medidas con historial, reseñas moderadas, CMS. Dinero en centavos enteros (`Int`), nunca float. |
| Clientes Supabase server/browser/admin | `src/lib/supabase/*` | Sesión por cookies httpOnly (`@supabase/ssr`). Cliente admin solo servidor. |
| Guardia server-side `/admin` | `src/middleware.ts` | Con Supabase configurado: exige sesión + rol ADMIN leído de la **base** (no del navegador). Sin configurar: modo demo explícito (la demo anterior sigue funcionando). |
| Máquinas de estado | `src/domain/state-machines.ts` | Transiciones permitidas de pedido/pago/envío. El comprobante de transferencia nunca confirma solo. |
| Validación de entrada | `src/lib/validation/schemas.ts` | Zod para auth, direcciones y medidas. |
| Dinero exacto | `src/lib/money.ts` | toCents/fromCents/formatCents. |
| Observabilidad mínima | `src/lib/logger.ts` | Logs JSON sin secretos ni datos personales. |
| Seed demo idempotente | `prisma/seed.ts` | Etiquetado `isDemo=true`; se salta sin DB. Limpieza: `npm run db:seed:clean`. |
| ESLint | `.eslintrc.json` + devDeps | `npm run lint` operativa (antes fallaba sin configuración). |
| Entorno sin secretos | `.env.example` | Con instrucciones exactas de dónde copiar cada clave. |

## Checklist de activación (1b) — para la boutique

1. Crear cuenta gratis en **supabase.com** → **New project**.
   - Name: `venecia` · Region: `sa-east-1 (São Paulo)` · Guardar la **contraseña de la DB** (se pide en el paso 3).
2. Copiar de **Project Settings → API**: `Project URL`, `anon public`, `service_role`.
3. Copiar de **Project Settings → Database → Connection string → URI** (elegir la conexión con pgbouncer/pooler y otra directa; reemplazar `[YOUR-PASSWORD]` por la contraseña del paso 1).
4. Completar `.env` (gitignored) con: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (directa, puerto 5432) y `DIRECT_URL` idéntica.
5. Hecho: `npx prisma migrate deploy` (tablas), `npm run db:seed` (contenido demo), y verificación completa con `npm run verify:supabase`.
6. Primer administrador: registrarse desde `/login` y luego correr (en Supabase → SQL Editor):
   ```sql
   update profiles set role = 'ADMIN' where email = '<tu-email>';
   ```

## Verificaciones que correré al activar (criterios de aceptación)

- CRUD de producto persiste tras reiniciar el servidor (`npm run build && npm start`).
- Usuaria común **no** accede a `/admin` por URL ni consulta pedidos ajenos cambiando IDs (RLS + proxy).
- Seed demo no contamina datos reales y `db:seed:clean` lo elimina completo.

## ✅ 1b EJECUTADO (17/11): activación de Supabase verificada

Proyecto Supabase: `csiddxjhnmzynqfzjnkj` (sa-east-1). Credenciales en `.env` local (gitignored, nunca al repo).

### Migraciones aplicadas (`npx prisma migrate deploy`)

1. `20261117022547_init` — 22 tablas del dominio (dinero en centavos enteros, snapshots inmutables).
2. `20261117030000_security_rls_auth` — seguridad:
   - Trigger `handle_new_user()` en `auth.users`: crea el perfil automáticamente con rol `CLIENTE`.
   - Función `is_admin()` (security definer) para políticas.
   - Trigger `guard_profile_role()`: una clienta **no puede cambiarse el rol** a sí misma (las escrituras del backend sin JWT y las de la admin pasan).
   - RLS activa en las 22 tablas con políticas: catálogo/CMS lectura pública; perfiles, direcciones, medidas, favoritos: filas propias; pedidos/items/pagos/historial/quotes: **solo lectura** para la dueña (las escrituras las hace el backend vía service_role, jamás el cliente); reseñas aprobadas lectura pública + alta propia; consultas: inserción pública, lectura propia; reservas: solo backend.
3. `20261117033000_updated_at_defaults` — defaults DB para `updatedAt` (necesarios para escrituras fuera del cliente Prisma, p. ej. el trigger de perfiles).

### Seed demo

`npm run db:seed` → 6 categorías, 3 colecciones, 8 productos, 25 variantes, 4 claves CMS — todo con `isDemo=true`.

### Verificación de extremo a extremo (`npx tsx scripts/verify-supabase.ts`) — 12/12 OK

Usuarios demo creados con la API admin real (password confirmado, sin email pendiente):
- `admin@venecia.com` / `VeneciaAdmin2026!` → **rol ADMIN** (promovido vía service_role).
- `valentina@demo.venecia` / `VeneciaDemo2026!` → clienta de prueba.

| Prueba | Resultado |
|---|---|
| Crear admin + clienta (idempotente) | ✅ |
| Trigger auto-crea `profiles` con nombre y rol CLIENTE | ✅ |
| Promoción a ADMIN vía service role | ✅ |
| Sign-in real con JWT de Supabase | ✅ |
| anon LEE el catálogo público (8 productos, isDemo) | ✅ |
| anon NO lee perfiles ajenos (RLS) | ✅ |
| anon NO crea pedidos (totales server-side only) | ✅ HTTP 400 |
| clienta ve SOLO su propio perfil (1 fila) | ✅ |
| clienta sin pedidos → `[]` | ✅ |
| Guardia: clienta NO puede auto-promoverse a ADMIN | ✅ HTTP 400 |

### Ajustes sobre el plan original (documentados)

- Conexión directa `db.*.supabase.co:5432` es **solo IPv6**; verificado `TcpTestSucceeded=True` desde la red local. Si algún día falla, pedir el URI del **Session/Transaction pooler** (puerto 6543).
- `profiles` no tiene columna `email`: el email vive en `auth.users` y se une 1:1 por `id` (decisión de diseño del schema).
- Se usan las claves nuevas de Supabase (`sb_publishable_*` como anon, `sb_secret_*` como service_role), soportadas por supabase-js 2.119.

### Tareas pendientes de la boutique

1. **Cambiar la contraseña del admin** en Supabase → Authentication → Users → `admin@venecia.com`, o iniciar sesión en la app y cambiarla desde ahí cuando exista el flujo.
2. **Promover su email real a ADMIN** (cuando se registre en la app):
   ```sql
   update public.profiles set role = 'ADMIN'
   where id = (select id from auth.users where email = '<tu-email>');
   ```
3. (Opcional) Desactivar el registro público si se prefiere que las cuentas las cree el backend.

## Pendiente de decisión/riesgos abiertos

- ✅ **Next.js 14 → 16 (APROBADO y ejecutado el 16/11):** la boutique aprobó la migración. Resultado verificado: `next@16.4.6` + `react@19.3.1` + `zustand@5.1` + ESLint 9 (flat config, `eslint .`), `middleware.ts` migrado a `proxy.ts` (convención de Next 16), `cookies()` async, validaciones de tipos corregidas. **Pruebas:** `npm run lint` → 0 errores; `npm run build` → ✓ con Turbopack (13 rutas); smoke test `npm start` → `/`, `/coleccion`, `/login` y `/admin` responden 200. `npm audit` de Next: limpio.
- ⚠️ **3 vulnerabilidades `high` residuales, solo en la CLI de Prisma** (`deepmerge-ts` vía `@prisma/config`): herramienta de desarrollo para migraciones, no corre en la app. El fix exige Prisma 7.10 (cambio disruptivo del workflow). Se documenta como riesgo dev-only aceptado y se revisará en Fase 7 (Calidad).
- Sin credenciales MP/email/Google: se mantienen como stubs marcados en `.env.example`.
