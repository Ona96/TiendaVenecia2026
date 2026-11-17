-- ============================================================
-- Seguridad y acceso: Supabase Auth + RLS
-- ------------------------------------------------------------
-- Modelo de acceso:
--   * anon / authenticated  → solo lo que aquí se permite (RLS).
--   * service_role          → bypasea RLS: lo usa el backend
--                             (escrituras de pedidos/pagos/quotes).
--   * postgres (Prisma CLI/seed) → dueño de las tablas, bypasea RLS.
-- Dinero y snapshots NUNCA se aceptan del cliente: las tablas de
-- transacciones no tienen políticas de INSERT/UPDATE anon.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Perfil automático al registrarse en auth.users
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, name)
  values (
    new.id,
    'CLIENTE',
    coalesce(
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 2. Helper: ¿la petición actual es de una administradora?
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()::text and role = 'ADMIN'
  );
$$;

-- ------------------------------------------------------------
-- 3. Guardia anti-escalada: una clienta no puede cambiarse el rol.
--    Cuando no hay JWT (backend/Prisma) o es admin, se permite.
-- ------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    if auth.uid()::text is null or public.is_admin() then
      return new;
    end if;
    raise exception 'Solo una administradora puede cambiar roles';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ------------------------------------------------------------
-- 4. RLS activa en todas las tablas del dominio
-- ------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.addresses             enable row level security;
alter table public.measurement_versions  enable row level security;
alter table public.categories            enable row level security;
alter table public.collections           enable row level security;
alter table public.products              enable row level security;
alter table public.product_images        enable row level security;
alter table public.product_variants      enable row level security;
alter table public.promotions            enable row level security;
alter table public.promotion_products    enable row level security;
alter table public.product_collections   enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.order_status_history  enable row level security;
alter table public.payments              enable row level security;
alter table public.reservations          enable row level security;
alter table public.quotes                enable row level security;
alter table public.quote_versions        enable row level security;
alter table public.reviews               enable row level security;
alter table public.favorites             enable row level security;
alter table public.inquiries             enable row level security;
alter table public.cms_content           enable row level security;

-- ------------------------------------------------------------
-- 5. Políticas
-- ------------------------------------------------------------

-- Perfil: la clienta ve y edita lo suyo (el rol lo protege el trigger 3).
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid()::text = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid()::text = id or public.is_admin());

-- Direcciones: CRUD completo propio.
drop policy if exists "addresses_own" on public.addresses;
create policy "addresses_own" on public.addresses
  for all using (auth.uid()::text = "profileId" or public.is_admin())
  with check (auth.uid()::text = "profileId");

-- Medidas: lectura propia; la escritura histórica la hace el backend.
drop policy if exists "measurements_select_own" on public.measurement_versions;
create policy "measurements_select_own" on public.measurement_versions
  for select using (auth.uid()::text = "profileId" or public.is_admin());

-- Catálogo público (anon + authenticated).
drop policy if exists "catalog_public_read" on public.categories;
create policy "catalog_public_read" on public.categories for select using (true);

drop policy if exists "collections_public_read" on public.collections;
create policy "collections_public_read" on public.collections for select using (true);

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select using (true);

drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read" on public.product_images for select using (true);

drop policy if exists "product_variants_public_read" on public.product_variants;
create policy "product_variants_public_read" on public.product_variants for select using (true);

drop policy if exists "promotions_public_read" on public.promotions;
create policy "promotions_public_read" on public.promotions for select using (true);

drop policy if exists "promotion_products_public_read" on public.promotion_products;
create policy "promotion_products_public_read" on public.promotion_products for select using (true);

drop policy if exists "product_collections_public_read" on public.product_collections;
create policy "product_collections_public_read" on public.product_collections for select using (true);

drop policy if exists "cms_public_read" on public.cms_content;
create policy "cms_public_read" on public.cms_content for select using (true);

-- Pedidos: la clienta solo LEE lo suyo. Crear/editar se hace en el
-- backend (Server Actions + service_role) para que los totales y
-- snapshots en centavos sean calculados por el servidor, jamás el cliente.
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid()::text = "profileId" or public.is_admin());

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = "orderId" and (o."profileId" = auth.uid()::text or public.is_admin())
    )
  );

drop policy if exists "order_history_select_own" on public.order_status_history;
create policy "order_history_select_own" on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = "orderId" and (o."profileId" = auth.uid()::text or public.is_admin())
    )
  );

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = "orderId" and (o."profileId" = auth.uid()::text or public.is_admin())
    )
  );

-- Presupuestos: lectura propia; altas por backend.
drop policy if exists "quotes_select_own" on public.quotes;
create policy "quotes_select_own" on public.quotes
  for select using (auth.uid()::text = "profileId" or public.is_admin());

drop policy if exists "quote_versions_select_own" on public.quote_versions;
create policy "quote_versions_select_own" on public.quote_versions
  for select using (
    exists (
      select 1 from public.quotes q
      where q.id = "quoteId" and (q."profileId" = auth.uid()::text or public.is_admin())
    )
  );

-- Reservas de stock: solo backend (no exponen datos sensibles a anon).
-- Sin políticas = denegado a anon/authenticated.

-- Reseñas: público lee aprobadas; clienta autenticada crea/edita la propia.
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews
  for select using (status = 'APROBADA' or auth.uid()::text = "profileId" or public.is_admin());

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid()::text = "profileId");

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update using (auth.uid()::text = "profileId" or public.is_admin());

-- Favoritos: CRUD propio.
drop policy if exists "favorites_own" on public.favorites;
create policy "favorites_own" on public.favorites
  for all using (auth.uid()::text = "profileId" or public.is_admin())
  with check (auth.uid()::text = "profileId");

-- Consultas: cualquiera puede ENVIAR (invitadas incluidas); la lectura
-- de la bandeja es solo para la dueña de la consulta o vía backend.
drop policy if exists "inquiries_public_insert" on public.inquiries;
create policy "inquiries_public_insert" on public.inquiries
  for insert with check (true);

drop policy if exists "inquiries_select_own" on public.inquiries;
create policy "inquiries_select_own" on public.inquiries
  for select using (auth.uid()::text = "profileId" or public.is_admin());

-- Grant de uso para los roles de API de Supabase.
grant usage on schema public to anon, authenticated;
