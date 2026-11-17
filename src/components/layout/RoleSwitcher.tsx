'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, UserCog } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useMounted } from '@/lib/hooks';
import { ROLE_LABEL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';

export function RoleSwitcher() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const loginAs = useAuthStore((s) => s.loginAs);
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

  function switchRole(role: Role) {
    loginAs(role);
    setOpen(false);
    router.push(role === 'ADMIN' ? '/admin' : '/');
    router.refresh();
  }

  function handleLogout() {
    logout();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase text-ivory/80 transition-colors hover:text-gold"
      >
        <UserCog className="h-3.5 w-3.5" />
        {mounted && currentUser ? (
          <span>
            {currentUser.name.split(' ')[0]} · {ROLE_LABEL[currentUser.role]}
          </span>
        ) : (
          <span>Invitada</span>
        )}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-64 border border-line bg-ivory py-2 shadow-luxe">
          <p className="px-4 pb-2 pt-1 text-[10px] uppercase tracking-luxe text-stone-400">
            Cambiar de rol (demo)
          </p>
          <button
            onClick={() => switchRole('CLIENTE')}
            className={cn(
              'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-charcoal transition-colors hover:bg-gold/10',
              mounted && currentUser?.role === 'CLIENTE' && 'bg-gold/10',
            )}
          >
            Continuar como Cliente
            {mounted && currentUser?.role === 'CLIENTE' && (
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            )}
          </button>
          <button
            onClick={() => switchRole('ADMIN')}
            className={cn(
              'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-charcoal transition-colors hover:bg-gold/10',
              mounted && currentUser?.role === 'ADMIN' && 'bg-gold/10',
            )}
          >
            Continuar como Administradora
            {mounted && currentUser?.role === 'ADMIN' && (
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            )}
          </button>
          <div className="my-2 border-t border-line" />
          {mounted && currentUser ? (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-stone-500 transition-colors hover:text-gold-dark"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </button>
          ) : (
            <button
              onClick={() => {
                setOpen(false);
                router.push('/login');
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gold-dark transition-colors hover:bg-gold/10"
            >
              Iniciar sesión con email
            </button>
          )}
        </div>
      )}
    </div>
  );
}
