'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, LogIn, Package, Ruler } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import {
  useCustomersStore,
} from '@/store/customers-store';
import {
  EMPTY_MEASUREMENTS,
  MeasurementsForm,
  measurementsSummary,
} from '@/components/store/MeasurementsForm';
import { formatDate } from '@/lib/utils';
import { useMounted } from '@/lib/hooks';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CustomMeasurements } from '@/lib/types';

export default function PerfilPage() {
  const mounted = useMounted();
  const currentUser = useAuthStore((s) => s.currentUser);
  const customers = useCustomersStore((s) => s.customers);
  const saveMeasurements = useCustomersStore((s) => s.saveMeasurements);
  const upsertCustomer = useCustomersStore((s) => s.upsertCustomer);

  const customer = currentUser
    ? customers.find((c) => c.email.toLowerCase() === currentUser.email.toLowerCase())
    : undefined;

  const [measurements, setMeasurements] = useState<CustomMeasurements | null>(null);
  const [saved, setSaved] = useState(false);

  // Overlay de ediciones: null = mostrar las medidas guardadas, sin efectos.
  const effectiveMeasurements: CustomMeasurements =
    measurements ?? customer?.savedMeasurements ?? EMPTY_MEASUREMENTS;

  if (!mounted) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-24 lg:px-10">
        <div className="mx-auto max-w-md space-y-3 text-center">
          <Skeleton className="mx-auto h-3 w-20" />
          <Skeleton className="mx-auto h-9 w-56" />
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl px-5 py-28 text-center">
        <LogIn className="mx-auto h-8 w-8 text-gold/60" />
        <h1 className="mt-5 font-display text-3xl text-charcoal">Ingresá a tu perfil</h1>
        <p className="mt-3 text-sm text-stone-500">
          Tus medidas guardadas y tu historial viven en tu cuenta del atelier.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block bg-charcoal px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) return;
    if (customer) {
      saveMeasurements(customer.id, effectiveMeasurements);
    } else {
      upsertCustomer({
        name: currentUser.name,
        email: currentUser.email,
        phone: '',
        city: '',
        notes: '',
        savedMeasurements: effectiveMeasurements,
      });
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-10">
      <div className="text-center">
        <p className="eyebrow">Mi cuenta</p>
        <h1 className="mt-3 font-display text-4xl text-charcoal">{currentUser.name}</h1>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {/* Datos */}
        <div className="border border-line bg-white p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-charcoal">Datos de la clienta</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="label">Email</dt>
              <dd className="text-charcoal">{currentUser.email}</dd>
            </div>
            <div>
              <dt className="label">Rol</dt>
              <dd className="text-charcoal">
                {currentUser.role === 'ADMIN' ? 'Administradora del atelier' : 'Cliente'}
              </dd>
            </div>
            <div>
              <dt className="label">Cliente desde</dt>
              <dd className="text-charcoal">
                {customer ? formatDate(customer.registeredAt) : '—'}
              </dd>
            </div>
            <div>
              <dt className="label">Teléfono</dt>
              <dd className="text-charcoal">{customer?.phone || '—'}</dd>
            </div>
            {customer?.city && (
              <div>
                <dt className="label">Ciudad</dt>
                <dd className="text-charcoal">{customer.city}</dd>
              </div>
            )}
          </dl>
          <Link
            href="/mis-pedidos"
            className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gold-dark transition-colors hover:text-charcoal"
          >
            <Package className="h-3.5 w-3.5" />
            Ver mis pedidos
          </Link>
        </div>

        {/* Medidas guardadas */}
        <form onSubmit={handleSave} className="border border-line bg-white p-7">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-charcoal">
            <Ruler className="h-4 w-4 text-gold-dark" />
            Mis medidas guardadas
          </p>
          {customer?.savedMeasurements && (
            <p className="mt-2 text-[11px] text-stone-400">
              Guardadas: {measurementsSummary(customer.savedMeasurements)}
            </p>
          )}
          <div className="mt-5">
            <MeasurementsForm
              value={effectiveMeasurements}
              onChange={(m) => setMeasurements(m)}
            />
          </div>
          <button
            type="submit"
            className="mt-6 flex w-full items-center justify-center gap-2 bg-charcoal px-6 py-3 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Medidas guardadas
              </>
            ) : (
              'Guardar medidas'
            )}
          </button>
          <p className="mt-3 text-center text-[11px] text-stone-400">
            Las usamos para precargar tu confección a medida en cualquier vestido.
          </p>
        </form>
      </div>
    </div>
  );
}
