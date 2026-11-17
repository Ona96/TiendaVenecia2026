'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, LogIn, LogOut, Package, UserRound } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useMounted } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export function AccountMenu() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  if (!currentUser) {
    return (
      <Link
        href="/login"
        className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-charcoal/70 transition-colors hover:text-gold-dark sm:flex"
      >
        <LogIn className="h-4 w-4" />
        Iniciar sesión
      </Link>
    );
  }

  const initial = currentUser.name.charAt(0);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/60 bg-gold/10 text-sm font-semibold text-gold-dark transition-colors hover:bg-gold/20"
        aria-label="Cuenta"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-60 border border-line bg-ivory py-2 shadow-luxe">
          <div className="px-4 pb-2">
            <p className="text-sm font-medium text-charcoal">{currentUser.name}</p>
            <p className="truncate text-xs text-stone-500">{currentUser.email}</p>
          </div>
          <div className="border-t border-line" />
          <Link
            href="/mis-pedidos"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal transition-colors hover:bg-gold/10"
          >
            <Package className="h-4 w-4 text-gold-dark" />
            Mis pedidos
          </Link>
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal transition-colors hover:bg-gold/10"
          >
            <UserRound className="h-4 w-4 text-gold-dark" />
            Mi perfil
          </Link>
          {currentUser.role === 'ADMIN' && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal transition-colors hover:bg-gold/10"
            >
              <LayoutDashboard className="h-4 w-4 text-gold-dark" />
              Panel del atelier
            </Link>
          )}
          <div className="border-t border-line" />
          <button
            onClick={() => {
              logout();
              setOpen(false);
              router.push('/');
              router.refresh();
            }}
            className={cn(
              'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm',
              'text-stone-500 transition-colors hover:text-gold-dark',
            )}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
