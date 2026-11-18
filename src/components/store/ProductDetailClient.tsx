'use client';

import { ProductImage } from '@/components/ui/ProductImage';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  Gem,
  Package,
  Ruler,
  Scissors,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useCustomersStore } from '@/store/customers-store';
import { useCartStore } from '@/store/cart-store';
import {
  EMPTY_MEASUREMENTS,
  MeasurementsForm,
  isMeasurementComplete,
} from '@/components/store/MeasurementsForm';
import { CATEGORY_LABEL, CUSTOM_SIZE } from '@/lib/constants';
import { formatCurrency, cn } from '@/lib/utils';
import type { CustomMeasurements, Product } from '@/lib/types';

/**
 * Ficha de producto con datos REALES (Fase 4): el Server Component
 * resuelve el producto por slug desde la base; acá va la interacción
 * (talles, medidas, carrito). El precio del carrito es informativo:
 * el checkout recalcula todo en el servidor.
 */
export function ProductDetailClient({ product }: { product: Product }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const customers = useCustomersStore((s) => s.customers);
  const savedMeasurements = currentUser
    ? customers.find((c) => c.email.toLowerCase() === currentUser.email.toLowerCase())
        ?.savedMeasurements
    : undefined;

  const addToCart = useCartStore((s) => s.addToCart);

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [measurements, setMeasurements] = useState<CustomMeasurements>(
    savedMeasurements ?? EMPTY_MEASUREMENTS,
  );
  const [error, setError] = useState<string | null>(null);

  const soldOut = product.stock <= 0;

  function handleAddToCart() {
    if (soldOut) return;

    if (!customMode && !selectedSize) {
      setError('Elegí un talle estándar o activá la confección a medida.');
      return;
    }
    if (customMode && !isMeasurementComplete(measurements)) {
      setError('Completá las cuatro medidas (busto, cintura, cadera y largo) en centímetros.');
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      size: customMode ? CUSTOM_SIZE : selectedSize,
      quantity: 1,
      measurements: customMode ? measurements : undefined,
    });
    setError(null);
  }

  function useSavedMeasurements() {
    if (!savedMeasurements) return;
    setMeasurements(savedMeasurements);
    setCustomMode(true);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-10">
      <Link
        href="/coleccion"
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-stone-500 transition-colors hover:text-gold-dark"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Colección
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Galería */}
        <div>
          <div className="relative aspect-[3/4] overflow-hidden bg-line">
            <ProductImage
              src={product.images[activeImage] ?? ''}
              alt={product.name}
              fallbackLabel={product.name}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            {soldOut && (
              <span className="absolute left-4 top-4 bg-charcoal px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-ivory">
                Agotado
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setActiveImage(index)}
                  className={cn(
                    'relative aspect-[3/4] overflow-hidden border transition-colors',
                    activeImage === index ? 'border-gold' : 'border-transparent opacity-70 hover:opacity-100',
                  )}
                >
                  <ProductImage
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fallbackLabel={`${index + 1}`}
                    sizes="20vw"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información y compra */}
        <div>
          <p className="eyebrow">{CATEGORY_LABEL[product.category]}</p>
          <h1 className="mt-2 font-display text-4xl text-charcoal">{product.name}</h1>
          <p className="mt-3 text-2xl text-charcoal">{formatCurrency(product.price)}</p>

          <p className="mt-5 text-sm leading-relaxed text-stone-600">{product.description}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {product.fabrics.map((fabric) => (
              <span
                key={fabric}
                className="flex items-center gap-1.5 border border-gold/40 bg-gold/5 px-3 py-1 text-[11px] text-gold-dark"
              >
                <Gem className="h-3 w-3" />
                {fabric}
              </span>
            ))}
          </div>

          <p className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-charcoal/60">
            <Clock className="h-4 w-4 text-gold-dark" />
            {product.productionHours} horas de trabajo artesanal
          </p>

          {soldOut ? (
            <p className="mt-8 border border-line bg-white px-5 py-4 text-sm text-stone-500">
              Los cupos de producción para este vestido están agotados esta temporada. Escribinos a
              hola@venecia.com.ar para sumarte a la lista de espera.
            </p>
          ) : (
            <>
              {/* Talles estándar */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <p className="label">Talle estándar</p>
                  <span className="text-[10px] text-stone-400">Guía: XS 84 · S 88 · M 92 · L 96 · XL 100 cm de busto</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        setCustomMode(false);
                        setError(null);
                      }}
                      className={cn(
                        'min-w-[52px] border px-4 py-2.5 text-xs tracking-widest transition-colors',
                        !customMode && selectedSize === size
                          ? 'border-gold bg-gold text-charcoal'
                          : 'border-line bg-white hover:border-gold',
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confección a medida */}
              <div className="mt-4 border border-line bg-white p-5">
                <button
                  onClick={() => {
                    setCustomMode((v) => !v);
                    setError(null);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between text-left transition-colors',
                    customMode ? 'text-gold-dark' : 'text-charcoal hover:text-gold-dark',
                  )}
                >
                  <span className="flex items-center gap-2.5 text-xs uppercase tracking-[0.2em]">
                    <Scissors className="h-4 w-4" />
                    Confección a medida
                  </span>
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border text-[10px]',
                      customMode ? 'border-gold bg-gold text-charcoal' : 'border-line',
                    )}
                  >
                    {customMode ? '−' : '+'}
                  </span>
                </button>

                {customMode && (
                  <div className="mt-5 border-t border-line pt-5">
                    <p className="mb-4 text-sm leading-relaxed text-stone-500">
                      Ingresá tus medidas en centímetros. El taller confecciona un molde individual
                      e incluye tres pruebas de calce.
                    </p>
                    {savedMeasurements && (
                      <button
                        onClick={useSavedMeasurements}
                        className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gold-dark underline-offset-4 hover:underline"
                      >
                        <Ruler className="h-3.5 w-3.5" />
                        Usar mis medidas guardadas
                      </button>
                    )}
                    <MeasurementsForm value={measurements} onChange={setMeasurements} />
                  </div>
                )}
              </div>

              {error && (
                <p role="alert" className="form-error mt-4">
                  {error}
                </p>
              )}

              <button
                onClick={handleAddToCart}
                className={cn(
                  'mt-6 w-full px-6 py-4 text-xs uppercase tracking-[0.22em] transition-colors',
                  customMode
                    ? 'bg-gold text-charcoal hover:bg-gold-light'
                    : 'bg-charcoal text-ivory hover:bg-charcoal-soft',
                )}
              >
                {customMode
                  ? 'Agregar confección a medida al carrito'
                  : 'Agregar al carrito'}
              </button>
            </>
          )}

          {/* Detalles de confección */}
          <div className="mt-10 border-t border-line pt-8">
            <div className="grid grid-cols-2 gap-5">
              <div className="flex items-start gap-3">
                <Package className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-charcoal">Producción</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {soldOut ? 'Agotado' : `${product.stock} cupos esta temporada`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-charcoal">Demora</p>
                  <p className="mt-1 text-xs text-stone-500">
                    3 a 5 semanas según agenda del taller
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-charcoal">Ocasiones</p>
                  <p className="mt-1 text-xs text-stone-500">{product.occasions.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-charcoal">Calidad</p>
                  <p className="mt-1 text-xs text-stone-500">Control del atelier antes de enviar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
