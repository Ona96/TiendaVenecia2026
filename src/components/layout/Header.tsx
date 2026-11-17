'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { AccountMenu } from './AccountMenu';
import { useCartStore, selectCartCount } from '@/store/cart-store';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/coleccion', label: 'Colección' },
  { href: '/#medida', label: 'A Medida' },
  { href: '/#artesanal', label: 'Proceso Artesanal' },
];

export function Header() {
  const items = useCartStore((s) => s.items);
  const count = selectCartCount(items);
  const openCart = useCartStore((s) => s.openCart);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-10">
        {/* Menú móvil */}
        <button
          className="text-charcoal lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Navegación escritorio */}
        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] uppercase tracking-[0.22em] text-charcoal/70 transition-colors hover:text-gold-dark"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-center">
          <span className="font-display text-2xl tracking-[0.28em] text-charcoal">VENECIA</span>
          <span className="block text-[9px] uppercase tracking-luxe text-gold-dark">
            Alta Costura
          </span>
        </Link>

        {/* Acciones */}
        <div className="flex items-center gap-5">
          <button
            onClick={openCart}
            className="relative text-charcoal transition-colors hover:text-gold-dark"
            aria-label="Abrir carrito"
          >
            <ShoppingBag className="h-5 w-5" />
            {mounted && count > 0 && (
              <span
                className={cn(
                  'absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center',
                  'rounded-full bg-gold px-1 text-[9px] font-bold text-charcoal',
                )}
              >
                {count}
              </span>
            )}
          </button>
          <AccountMenu />
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {mobileOpen && (
        <nav className="border-t border-line bg-ivory px-5 py-4 lg:hidden">
          <ul className="space-y-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-[12px] uppercase tracking-[0.22em] text-charcoal/80"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
