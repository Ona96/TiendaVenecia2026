-- ============================================================
-- Storage de fotos de productos (Fase 8: la admin sube las fotos
-- desde el panel; nada de escribir archivos en el servidor).
--
-- Bucket público `productos`:
--  - Lectura pública (el storefront muestra las fotos sin sesión).
--  - Escritura SOLO para ADMIN (rol verificado contra profiles,
--    con la misma guardia que el resto del panel).
--  - Idempotente: safe to re-run.
-- ============================================================

-- 1. Bucket público.
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do update set public = true;

-- 2. Lectura pública de los objetos del bucket.
drop policy if exists "productos_public_read" on storage.objects;
create policy "productos_public_read" on storage.objects
  for select
  using (bucket_id = 'productos');

-- 3. Escritura (insert/update/delete) solo para administradoras.
--    Usa la misma función is_admin() del dominio (rol desde la base).
drop policy if exists "productos_admin_write" on storage.objects;
create policy "productos_admin_write" on storage.objects
  for all
  using (bucket_id = 'productos' and public.is_admin())
  with check (bucket_id = 'productos' and public.is_admin());
