'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Scissors,
  Shirt,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/env';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList, exact: false },
  { href: '/admin/prendas', label: 'Prendas', icon: Shirt, exact: false },
  { href: '/admin/presupuestos', label: 'Presupuestos', icon: Scissors, exact: false },
  { href: '/admin/clientes', label: 'Clientas', icon: Users, exact: false },
];

export function AdminShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);

  function isActive(item: (typeof ADMIN_NAV)[number]) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  return (
    <div className="flex min-h-screen">
      <a href="#contenido-admin" className="skip-link">
        Saltar al contenido
      </a>
      {/* Sidebar escritorio */}
      <aside className="hidden w-60 shrink-0 flex-col bg-charcoal text-ivory lg:flex">
        <div className="px-6 py-7">
          <Link href="/admin" className="font-display text-xl tracking-[0.28em]">
            VENECIA
          </Link>
          <p className="mt-1 text-[9px] uppercase tracking-luxe text-gold">Panel del Atelier</p>
        </div>
        <nav aria-label="Navegación del atelier" className="flex-1 space-y-1 px-3">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-[0.18em] transition-colors',
                isActive(item)
                  ? 'bg-gold text-charcoal'
                  : 'text-ivory/60 hover:bg-ivory/5 hover:text-gold',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-3 border-t border-ivory/10 px-5 py-5">
          <div>
            <p className="text-xs text-ivory">{currentUser?.name}</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-gold">Administradora</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ivory/50 transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Ver la boutique
          </Link>
          <button
            onClick={() => {
              if (isSupabaseConfigured()) void createSupabaseBrowserClient()?.auth.signOut();
              logout();
              router.push('/');
              router.refresh();
            }}
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ivory/50 transition-colors hover:text-gold"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header mobile */}
        <div className="bg-charcoal lg:hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <Link href="/admin" className="font-display text-lg tracking-[0.28em] text-ivory">
              VENECIA
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-ivory/60"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Boutique
            </Link>
          </div>
          <nav
            aria-label="Navegación del atelier"
            className="flex gap-1 overflow-x-auto px-3 pb-3 no-scrollbar"
          >
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item) ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] transition-colors',
                  isActive(item)
                    ? 'bg-gold text-charcoal'
                    : 'bg-ivory/5 text-ivory/60 hover:text-gold',
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <main id="contenido-admin" tabIndex={-1} className="flex-1 bg-ivory">
          {children}
        </main>
      </div>
    </div>
  );
}
