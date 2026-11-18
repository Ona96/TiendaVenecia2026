'use client';

import { useState, useTransition } from 'react';
import { Ruler, Save, X } from 'lucide-react';
import type { AdminCustomerView } from '@/server/admin/customers';
import { updateCustomerContact } from '@/server/admin/actions';
import { formatCents } from '@/lib/money';
import { formatDate } from '@/lib/utils';

/**
 * Ficha de clienta con datos REALES (Fase 3).
 * Email y medidas: lectura (la clienta los gestiona desde su perfil).
 * Teléfono: editable por la admin con server action.
 */
export function CustomerDetailModal({
  customer,
  onClose,
}: {
  customer: AdminCustomerView;
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [phone, setPhone] = useState(customer.phone ?? '');

  function savePhone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    start(async () => {
      const result = await updateCustomerContact(customer.id, phone.trim());
      if (!result.ok) setError(result.error);
      else {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-ivory shadow-luxe">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-ivory px-7 py-5">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 bg-gold/10 font-display text-lg text-gold-dark">
              {customer.name.charAt(0)}
            </span>
            <div>
              <p className="font-display text-2xl text-charcoal">{customer.name}</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">
                {customer.role === 'ADMIN' ? 'Administradora' : 'Clienta'} desde{' '}
                {formatDate(customer.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center text-charcoal transition-colors hover:bg-gold/10 hover:text-gold-dark"
            aria-label="Cerrar detalle"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-7 px-7 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-line bg-white p-5 text-sm">
              <p className="label">Contacto</p>
              {/* Email y medidas: la clienta los gestiona desde su perfil. */}
              <p className="text-charcoal">{customer.email ?? 'Email no visible'}</p>
              <p className="text-stone-500">{customer.city ?? '—'}</p>
              <form onSubmit={savePhone} className="mt-4 flex gap-2">
                <input
                  aria-label="Teléfono de la clienta"
                  className="field py-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 …"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-1.5 border border-charcoal/25 px-4 text-[10px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
                >
                  <Save className="h-3.5 w-3.5" />
                  Guardar
                </button>
              </form>
              {saved && (
                <p role="status" className="mt-2 text-[11px] text-success">
                  Teléfono actualizado.
                </p>
              )}
            </div>

            <div className="border border-line bg-white p-5 text-sm">
              <p className="label">Medidas registradas</p>
              {customer.measurements ? (
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-gold-dark" aria-hidden />
                  <span className="text-charcoal">
                    Busto {customer.measurements.busto} · Cintura {customer.measurements.cintura} ·
                    Cadera {customer.measurements.cadera} · Largo {customer.measurements.largo} cm
                  </span>
                </div>
              ) : (
                <p className="text-stone-500">
                  Sin medidas registradas. La clienta las carga desde su perfil.
                </p>
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="border border-error-soft bg-error-soft px-4 py-2.5 text-xs text-error">
              {error}
            </p>
          )}

          <div className="border border-line bg-white p-5 text-sm">
            <p className="label">Historial comercial</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-display text-2xl text-charcoal">{customer.ordersCount}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-stone-400">Pedidos</p>
              </div>
              <div>
                <p className="font-display text-2xl text-charcoal">
                  {formatCents(customer.totalSpentCents)}
                </p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-stone-400">Facturado</p>
              </div>
              <div>
                <p className="font-display text-2xl text-charcoal">
                  {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '—'}
                </p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-stone-400">Última compra</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
