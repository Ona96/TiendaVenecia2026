'use client';

import { ProductImage } from '@/components/ui/ProductImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Minus, Plus, Scissors, Trash2 } from 'lucide-react';
import {
  useCartStore,
  selectCartCount,
  selectCartSubtotal,
} from '@/store/cart-store';
import {
  CUSTOM_SIZE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT,
} from '@/lib/constants';
import { measurementsSummary } from '@/components/store/MeasurementsForm';
import { formatCurrency } from '@/lib/utils';
import { useMounted } from '@/lib/hooks';

export default function CarritoPage() {
  const router = useRouter();
  const mounted = useMounted();
  const items = useCartStore((s) => s.items);
  const workshopNotes = useCartStore((s) => s.workshopNotes);
  const setWorkshopNotes = useCartStore((s) => s.setWorkshopNotes);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);

  if (!mounted) {
    return <div className="mx-auto max-w-6xl px-5 py-24 lg:px-10" />;
  }

  const count = selectCartCount(items);
  const subtotal = selectCartSubtotal(items);
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = freeShipping ? 0 : SHIPPING_FLAT;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-28 text-center">
        <Scissors className="mx-auto h-8 w-8 text-gold/60" />
        <h1 className="mt-5 font-display text-3xl text-charcoal">Tu carrito está vacío</h1>
        <p className="mt-3 text-sm text-stone-500">
          Cuando elijas un vestido vas a poder sumarlo acá, en talle estándar o confeccionado a
          medida.
        </p>
        <Link
          href="/coleccion"
          className="mt-8 inline-block bg-charcoal px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
        >
          Explorar la colección
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-10">
      <div className="text-center">
        <p className="eyebrow">Paso 1 de 2</p>
        <h1 className="mt-3 font-display text-4xl text-charcoal">Tu carrito</h1>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Lista de prendas */}
        <div>
          <ul className="divide-y divide-line border-y border-line">
            {items.map((item) => (
              <li key={item.key} className="flex gap-5 py-6">
                <Link
                  href={`/producto/${item.productId}`}
                  className="relative h-36 w-28 shrink-0 overflow-hidden bg-line"
                >
                  <ProductImage src={item.image} alt={item.name} fallbackLabel={item.name} sizes="112px" className="object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg text-charcoal">{item.name}</p>
                      {item.size === CUSTOM_SIZE ? (
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-gold-dark">
                          <Scissors className="h-3 w-3" />
                          A medida · {item.measurements ? measurementsSummary(item.measurements) : ''}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-stone-500">
                          Talle {item.size}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-stone-500">
                        {formatCurrency(item.price)} cada una
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.key)}
                      className="text-stone-400 transition-colors hover:text-red-600"
                      aria-label={`Quitar ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center border border-line bg-white">
                      <button
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="px-3 py-2 text-charcoal transition-colors hover:text-gold-dark"
                        aria-label="Restar"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[32px] text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        className="px-3 py-2 text-charcoal transition-colors hover:text-gold-dark"
                        aria-label="Sumar"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-base text-charcoal">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Notas para el taller */}
          <div className="mt-8 border border-line bg-white p-6">
            <label htmlFor="notes" className="label">
              Notas especiales para el taller
            </label>
            <textarea
              id="notes"
              rows={3}
              value={workshopNotes}
              onChange={(e) => setWorkshopNotes(e.target.value)}
              placeholder="Ej.: forro de algodón, moño dorado, ajustar el largo a tacón de 8 cm…"
              className="field resize-none"
            />
            <p className="mt-2 text-[11px] text-stone-400">
              Estas notas viajan directo a la mesa de trabajo del atelier.
            </p>
          </div>
        </div>

        {/* Resumen */}
        <aside>
          <div className="sticky top-24 border border-line bg-white p-7">
            <p className="text-xs uppercase tracking-[0.22em] text-charcoal">Resumen</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Prendas ({count})</dt>
                <dd className="text-charcoal">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Envío</dt>
                <dd className={freeShipping ? 'text-gold-dark' : 'text-charcoal'}>
                  {freeShipping ? 'Gratis' : formatCurrency(shipping)}
                </dd>
              </div>
              <div className="border-t border-line pt-3">
                <div className="flex justify-between text-base">
                  <dt className="uppercase tracking-[0.18em] text-charcoal">Total</dt>
                  <dd className="font-medium text-charcoal">{formatCurrency(subtotal + shipping)}</dd>
                </div>
              </div>
            </dl>
            <button
              onClick={() => router.push('/checkout')}
              className="mt-6 flex w-full items-center justify-center gap-2 bg-charcoal px-6 py-3.5 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
            >
              Finalizar compra
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/coleccion"
              className="mt-3 block text-center text-[11px] uppercase tracking-[0.2em] text-charcoal/60 transition-colors hover:text-gold-dark"
            >
              Seguir mirando vestidos
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
