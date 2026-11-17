'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import { useCartStore, selectCartSubtotal } from '@/store/cart-store';
import { CUSTOM_SIZE, FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT } from '@/lib/constants';
import { measurementsSummary } from './MeasurementsForm';
import { formatCurrency, cn } from '@/lib/utils';
import { useMounted } from '@/lib/hooks';

export function CartDrawer() {
  const router = useRouter();
  const mounted = useMounted();
  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);

  if (!mounted) return null;

  const subtotal = selectCartSubtotal(items);
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFree = FREE_SHIPPING_THRESHOLD - subtotal;
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  return (
    <div
      className={cn('fixed inset-0 z-50', !isDrawerOpen && 'pointer-events-none')}
      aria-hidden={!isDrawerOpen}
    >
      <div
        onClick={closeCart}
        className={cn(
          'absolute inset-0 bg-charcoal/50 backdrop-blur-sm transition-opacity duration-300',
          isDrawerOpen ? 'opacity-100' : 'opacity-0',
        )}
      />

      <aside
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory shadow-luxe transition-transform duration-300',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <p className="flex items-center gap-2.5 text-xs uppercase tracking-[0.22em] text-charcoal">
            <ShoppingBag className="h-4 w-4 text-gold-dark" />
            Tu carrito
            {items.length > 0 && <span className="text-stone-400">({items.length})</span>}
          </p>
          <button
            onClick={closeCart}
            className="text-charcoal transition-colors hover:text-gold-dark"
            aria-label="Cerrar carrito"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <ShoppingBag className="h-8 w-8 text-gold/60" />
            <p className="font-display text-xl text-charcoal">Tu carrito está vacío</p>
            <p className="text-sm text-stone-500">
              Elegí un vestido de la colección o empezá tu confección a medida.
            </p>
            <Link
              href="/coleccion"
              onClick={closeCart}
              className="mt-2 bg-charcoal px-6 py-3 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
            >
              Ver la colección
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line bg-white px-6 py-3">
              {freeShipping ? (
                <p className="flex items-center gap-2 text-xs text-gold-dark">
                  <Truck className="h-3.5 w-3.5" />
                  ¡Envío con embalaje de gala incluido!
                </p>
              ) : (
                <p className="text-xs text-stone-500">
                  Te faltan{' '}
                  <span className="font-medium text-charcoal">{formatCurrency(remainingForFree)}</span>{' '}
                  para el envío gratis
                </p>
              )}
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ul className="space-y-5">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-4 border-b border-line pb-5 last:border-0">
                    <div className="relative h-28 w-20 shrink-0 overflow-hidden bg-line">
                      <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-base text-charcoal">{item.name}</p>
                        <button
                          onClick={() => removeFromCart(item.key)}
                          className="text-stone-400 transition-colors hover:text-red-600"
                          aria-label={`Quitar ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-gold-dark">
                        {item.size === CUSTOM_SIZE
                          ? `A medida · ${item.measurements ? measurementsSummary(item.measurements) : ''}`
                          : `Talle ${item.size}`}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border border-line">
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            className="px-2.5 py-1.5 text-charcoal transition-colors hover:text-gold-dark"
                            aria-label="Restar"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[28px] text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            className="px-2.5 py-1.5 text-charcoal transition-colors hover:text-gold-dark"
                            aria-label="Sumar"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm text-charcoal">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-line px-6 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="uppercase tracking-[0.18em] text-stone-500">Subtotal</span>
                <span className="text-charcoal">{formatCurrency(subtotal)}</span>
              </div>
              <p className="mt-1 text-[11px] text-stone-400">
                Envío: {freeShipping ? 'gratis' : `${formatCurrency(SHIPPING_FLAT)} (se calcula en el checkout)`}
              </p>
              <button
                onClick={() => {
                  closeCart();
                  router.push('/checkout');
                }}
                className="mt-4 w-full bg-gold px-6 py-3.5 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-light"
              >
                Iniciar checkout
              </button>
              <Link
                href="/carrito"
                onClick={closeCart}
                className="mt-3 block text-center text-[11px] uppercase tracking-[0.2em] text-charcoal/60 transition-colors hover:text-gold-dark"
              >
                Ver carrito completo
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
