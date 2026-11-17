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
4. Completar `.env.local` (basado en `.env.example`) con: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (pooler, puerto 6543) y `DIRECT_URL` (directa, puerto 5432).
5. Avisar: yo ejecuto `npm run db:migrate` (crea tablas), `npm run db:seed` (contenido demo), y verifico auth + guardia `/admin`.
6. Primer administrador: registrarse desde `/login` y luego correr (en Supabase → SQL Editor):
   ```sql
   update profiles set role = 'ADMIN' where email = '<tu-email>';
   ```

## Verificaciones que correré al activar (criterios de aceptación)

- CRUD de producto persiste tras reiniciar el servidor (`npm run build && npm start`).
- Usuaria común **no** accede a `/admin` por URL ni consulta pedidos ajenos cambiando IDs (RLS + middleware).
- Seed demo no contamina datos reales y `db:seed:clean` lo elimina completo.

## Pendiente de decisión/riesgos abiertos

- ✅ **Next.js 14 → 16 (APROBADO y ejecutado el 16/11):** la boutique aprobó la migración. Resultado verificado: `next@16.4.6` + `react@19.3.1` + `zustand@5.1` + ESLint 9 (flat config, `eslint .`), `middleware.ts` migrado a `proxy.ts` (convención de Next 16), `cookies()` async, validaciones de tipos corregidas. **Pruebas:** `npm run lint` → 0 errores; `npm run build` → ✓ con Turbopack (13 rutas); smoke test `npm start` → `/`, `/coleccion`, `/login` y `/admin` responden 200. `npm audit` de Next: limpio.
- ⚠️ **3 vulnerabilidades `high` residuales, solo en la CLI de Prisma** (`deepmerge-ts` vía `@prisma/config`): herramienta de desarrollo para migraciones, no corre en la app. El fix exige Prisma 7.10 (cambio disruptivo del workflow). Se documenta como riesgo dev-only aceptado y se revisará en Fase 7 (Calidad).
- Sin credenciales MP/email/Google: se mantienen como stubs marcados en `.env.example`.
