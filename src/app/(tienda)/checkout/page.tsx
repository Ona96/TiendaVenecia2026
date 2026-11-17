'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, CheckCircle2, PackageCheck, Scissors } from 'lucide-react';
import { useCartStore, selectCartSubtotal } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { useCustomersStore } from '@/store/customers-store';
import { useOrdersStore } from '@/store/orders-store';
import {
  CUSTOM_SIZE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT,
  SHIPPING_PROVINCES,
} from '@/lib/constants';
import { measurementsSummary } from '@/components/store/MeasurementsForm';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { useMounted } from '@/lib/hooks';
import type { Order } from '@/lib/types';

export default function CheckoutPage() {
  const mounted = useMounted();
  const currentUser = useAuthStore((s) => s.currentUser);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const upsertCustomer = useCustomersStore((s) => s.upsertCustomer);
  const createOrder = useOrdersStore((s) => s.createOrder);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    province: SHIPPING_PROVINCES[0] as string,
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

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

  function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresá un email válido para avisarte del avance del vestido.');
      return;
    }
    if (!form.name.trim() || !form.address.trim()) {
      setError('Completá tu nombre y la dirección de envío.');
      return;
    }

    const customer = upsertCustomer({
      name: name.trim(),
      email: normalizedEmail,
      phone: form.phone.trim(),
      city: form.province,
      notes: '',
    });

    const order = createOrder({
      customerId: customer.id,
      customerName: name.trim(),
      customerEmail: normalizedEmail,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        size: item.size,
        quantity: item.quantity,
        measurements: item.measurements,
      })),
      subtotal,
      shipping,
      shippingAddress: `${form.address.trim()}, ${form.province}`,
      workshopNotes: form.notes.trim(),
    });

    clearCart();
    setPlacedOrder(order);
    window.scrollTo({ top: 0 });
  }

  // Vista de confirmación
  if (placedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center lg:px-10">
        <CheckCircle2 className="mx-auto h-12 w-12 text-gold" />
        <p className="eyebrow mt-6">Pedido confirmado</p>
        <h1 className="mt-3 font-display text-4xl text-charcoal">¡Gracias, {placedOrder.customerName.split(' ')[0]}!</h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-500">
          Tu vestido <span className="text-charcoal">{placedOrder.items[0]?.name}</span>
          {placedOrder.items.length > 1 ? ' y las demás prendas' : ''} ya están en la mesa del
          atelier. Te avisamos por email en cada paso de la confección.
        </p>

        <div className="mt-8 border border-line bg-white p-7 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="label">Código de pedido</p>
              <p className="font-display text-2xl tracking-wider text-charcoal">{placedOrder.code}</p>
            </div>
            <StatusBadge status={placedOrder.status} />
          </div>
          <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Total</dt>
              <dd className="text-charcoal">{formatCurrency(placedOrder.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Envío a</dt>
              <dd className="max-w-[60%] text-right text-charcoal">{placedOrder.shippingAddress}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/mis-pedidos"
            className="bg-charcoal px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
          >
            Ver seguimiento en mis pedidos
          </Link>
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
        <form onSubmit={placeOrder} className="border border-line bg-white p-7">
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
            <div className="sm:col-span-2">
              <label className="label" htmlFor="address">Dirección completa</label>
              <input
                id="address"
                required
                className="field"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Calle, número, piso, ciudad"
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

          {error && (
            <p className="mt-5 border border-red-300/60 bg-red-50 px-4 py-2.5 text-xs text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-7 w-full bg-gold px-6 py-4 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-light"
          >
            Confirmar pedido · {formatCurrency(total)}
          </button>
          <p className="mt-3 text-center text-[11px] text-stone-400">
            Coordinamos el pago por transferencia o link de pago al confirmar el pedido.
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
                    <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
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
                <dt className="uppercase tracking-[0.18em] text-charcoal">Total</dt>
                <dd className="font-medium text-charcoal">{formatCurrency(total)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
