'use client';

import { ProductImage } from '@/components/ui/ProductImage';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { ArrowLeft, CheckCircle2, PackageCheck, Scissors } from 'lucide-react';
import { useCartStore, selectCartSubtotal } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { placeOrder, type CheckoutInput } from '@/server/store/checkout';
import {
  CUSTOM_SIZE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT,
  SHIPPING_PROVINCES,
} from '@/lib/constants';
import { measurementsSummary } from '@/components/store/MeasurementsForm';
import { formatCurrency } from '@/lib/utils';
import { formatCents } from '@/lib/money';
import { useMounted } from '@/lib/hooks';
import { ErrorNotice } from '@/components/ui/ErrorNotice';

/**
 * Checkout (Fase 4): el carrito es del navegador, el PEDIDO lo concretiza
 * el servidor. Precios, stock y totales se recalculan en la base: lo que
 * ves acá es un estimado hasta que la action responde con el código real.
 */
export default function CheckoutPage() {
  const mounted = useMounted();
  const currentUser = useAuthStore((s) => s.currentUser);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const [pending, start] = useTransition();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: SHIPPING_PROVINCES[0] as string,
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ code: string; totalCents: number } | null>(null);

  // Autocompletado derivado en render: si la clienta no escribió nada,
  // se muestran los datos de su cuenta (store hidratado), sin efectos.
  const name = form.name || currentUser?.name || '';
  const email = form.email || currentUser?.email || '';

  const subtotal = selectCartSubtotal(items);
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = freeShipping ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0 || pending) return;
    setError(null);

    const payload: CheckoutInput = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: form.phone.trim(),
      street: form.address.trim(),
      city: form.city.trim(),
      province: form.province,
      notes: form.notes.trim() || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
        measurements: item.measurements ?? undefined,
      })),
    };

    start(async () => {
      const result = await placeOrder(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      clearCart();
      setPlaced({ code: result.code, totalCents: result.totalCents });
      window.scrollTo({ top: 0 });
    });
  }

  // Vista de confirmación (datos devueltos por el servidor).
  if (placed) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center lg:px-10">
        <CheckCircle2 className="mx-auto h-12 w-12 text-gold" />
        <p className="eyebrow mt-6">Pedido registrado</p>
        <h1 className="mt-3 font-display text-4xl text-charcoal">
          ¡Gracias, {name.split(' ')[0] || 'bienvenida'}!
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-500">
          Tu pedido entró a la agenda del atelier. Te vamos a contactar por email para coordinar el
          pago por transferencia y cada paso de la confección.
        </p>

        <div className="mt-8 border border-line bg-white p-7 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="label">Código de pedido</p>
              <p className="font-display text-2xl tracking-wider text-charcoal">{placed.code}</p>
            </div>
            <span className="rounded-full bg-warn-soft px-3 py-1 text-[11px] font-medium tracking-wide text-warn">
              Pendiente de confirmación
            </span>
          </div>
          <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Total</dt>
              <dd className="text-charcoal">{formatCents(placed.totalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Envío a</dt>
              <dd className="max-w-[60%] text-right text-charcoal">
                {form.address}, {form.city}, {form.province}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/coleccion"
            className="border border-charcoal/30 px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark"
          >
            Seguir explorando
          </Link>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return <div className="mx-auto max-w-6xl px-5 py-24 lg:px-10" />;
  }

  // Carrito vacío
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-28 text-center">
        <PackageCheck className="mx-auto h-8 w-8 text-gold/60" />
        <h1 className="mt-5 font-display text-3xl text-charcoal">No hay nada para comprar aún</h1>
        <p className="mt-3 text-sm text-stone-500">
          Sumá un vestido al carrito para continuar con el checkout.
        </p>
        <Link
          href="/coleccion"
          className="mt-8 inline-block bg-charcoal px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
        >
          Ir a la colección
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-10">
      <Link
        href="/carrito"
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-stone-500 transition-colors hover:text-gold-dark"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver al carrito
      </Link>

      <div className="mt-4 text-center">
        <p className="eyebrow">Paso 2 de 2</p>
        <h1 className="mt-3 font-display text-4xl text-charcoal">Checkout</h1>
        {!currentUser && (
          <p className="mt-2 text-xs text-stone-400">
            Comprás como invitada ·{' '}
            <Link href="/login" className="text-gold-dark underline-offset-4 hover:underline">
              iniciar sesión
            </Link>
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Formulario */}
        <form onSubmit={submitOrder} className="border border-line bg-white p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-charcoal">Datos de envío</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Nombre y apellido</label>
              <input
                id="name"
                required
                className="field"
                value={name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Valentina López"
              />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="field"
                value={email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">Teléfono</label>
              <input
                id="phone"
                required
                className="field"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+54 9 11 …"
              />
            </div>
            <div>
              <label className="label" htmlFor="province">Provincia / Zona</label>
              <select
                id="province"
                className="field"
                value={form.province}
                onChange={(e) => updateField('province', e.target.value)}
              >
                {SHIPPING_PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="address">Dirección completa</label>
              <input
                id="address"
                required
                className="field"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Calle, número, piso"
              />
            </div>
            <div>
              <label className="label" htmlFor="city">Ciudad</label>
              <input
                id="city"
                required
                className="field"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Posadas, CABA…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="checkout-notes">
                Notas especiales para el taller
              </label>
              <textarea
                id="checkout-notes"
                rows={3}
                className="field resize-none"
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Ej.: forro de algodón, moño dorado, ajuste de largo…"
              />
            </div>
          </div>

          {error && <ErrorNotice message={error} className="mt-5" />}

          <button
            type="submit"
            disabled={pending}
            className="mt-7 w-full bg-gold px-6 py-4 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-light disabled:opacity-40"
          >
            {pending
              ? 'Registrando tu pedido…'
              : `Confirmar pedido · ${formatCurrency(total)}`}
          </button>
          <p className="mt-3 text-center text-[11px] text-stone-400">
            Coordinamos el pago por transferencia al confirmar el pedido. El total definitivo lo
            calcula el atelier con el stock real.
          </p>
        </form>

        {/* Resumen del pedido */}
        <aside>
          <div className="sticky top-24 border border-line bg-white p-7">
            <p className="text-xs uppercase tracking-[0.22em] text-charcoal">Tu pedido</p>
            <ul className="mt-5 space-y-4">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-line">
                    <ProductImage src={item.image} alt={item.name} fallbackLabel={item.name} sizes="48px" className="object-cover" />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="text-sm text-charcoal">{item.name}</p>
                    {item.size === CUSTOM_SIZE ? (
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-gold-dark">
                        <Scissors className="h-2.5 w-2.5" />
                        A medida {item.measurements ? `· ${measurementsSummary(item.measurements)}` : ''}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-stone-500">
                        Talle {item.size} · x{item.quantity}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-charcoal">{formatCurrency(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd className="text-charcoal">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Envío</dt>
                <dd className={freeShipping ? 'text-gold-dark' : 'text-charcoal'}>
                  {freeShipping ? 'Gratis' : formatCurrency(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="uppercase tracking-[0.18em] text-charcoal">Total estimado</dt>
                <dd className="font-medium text-charcoal">{formatCurrency(total)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
