-- Defaults a nivel DB para updatedAt.
-- Prisma maneja @updatedAt en el cliente, pero las escrituras por fuera
-- de Prisma (trigger handle_new_user sobre profiles) necesitan un default.
alter table public.profiles     alter column "updatedAt" set default now();
alter table public.products     alter column "updatedAt" set default now();
alter table public.orders       alter column "updatedAt" set default now();
alter table public.quotes       alter column "updatedAt" set default now();
alter table public.cms_content  alter column "updatedAt" set default now();
