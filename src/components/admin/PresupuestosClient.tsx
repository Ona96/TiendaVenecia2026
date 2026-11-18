'use client';

import { useState, useTransition } from 'react';
import { Plus, Scissors, Tag, X } from 'lucide-react';
import type { AdminQuoteView } from '@/server/admin/quotes';
import { createQuoteVersion, setQuoteStatus } from '@/server/store/quote-actions';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { formatCents } from '@/lib/money';
import { formatDate } from '@/lib/utils';

interface QuoteVersionJson {
  tipo?: string;
  ocasion?: string;
  fechaEvento?: string | null;
  descripcion?: string;
  telasIdea?: string | null;
  presupuestoOrientativo?: string | null;
  items?: { nombre: string; detalle?: string | null; priceCents: number }[];
}

const STATUS_LABEL: Record<string, string> = {
  ENVIADA: 'Enviada',
  ACLARACION_PENDIENTE: 'Aclaración pendiente',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
};

const STATUS_TONE: Record<string, string> = {
  ENVIADA: 'bg-warn-soft text-warn',
  ACLARACION_PENDIENTE: 'bg-warn-soft text-warn',
  ACEPTADA: 'bg-success-soft text-success',
  RECHAZADA: 'bg-error-soft text-error',
};

/** Presupuestos del panel (Fase 5). */
export function PresupuestosClient({ quotes }: { quotes: AdminQuoteView[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [versionTarget, setVersionTarget] = useState<AdminQuoteView | null>(null);

  function mark(quoteId: string, next: 'ACLARACION_PENDIENTE' | 'RECHAZADA') {
    setError(null);
    start(async () => {
      const result = await setQuoteStatus(quoteId, next);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="p-6 lg:p-10">
      <div>
        <p className="eyebrow">Confección especial</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Presupuestos</h1>
        <p className="mt-2 text-sm text-stone-500">
          {quotes.length} {quotes.length === 1 ? 'solicitud' : 'solicitudes'} · cada propuesta es una
          versión nueva, nunca se pisa la anterior
        </p>
      </div>

      {error && <ErrorNotice message={error} className="mt-4" />}

      {quotes.length === 0 ? (
        <div className="mt-10 border border-line bg-white px-8 py-20 text-center">
          <Tag className="mx-auto h-8 w-8 text-gold/60" />
          <p className="mt-4 font-display text-2xl text-charcoal">No hay solicitudes todavía</p>
          <p className="mt-2 text-sm text-stone-500">
            Cuando una clienta pida su vestido especial desde la web, aparece acá.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {quotes.map((quote) => {
            const request = (quote.versions[0]?.itemsJson ?? {}) as QuoteVersionJson;
            const latest = quote.versions[quote.versions.length - 1];
            const proposal = (latest?.itemsJson ?? {}) as QuoteVersionJson;
            const hasProposal = proposal.tipo === 'propuesta';

            return (
              <article key={quote.id} className="flex flex-col border border-line bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
                  <div>
                    <p className="font-display text-lg tracking-wider text-charcoal">{quote.code}</p>
                    <p className="text-[11px] text-stone-400">
                      {formatDate(quote.createdAt)} · versión {latest?.version}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-medium ${STATUS_TONE[quote.status] ?? 'bg-warn-soft text-warn'}`}
                  >
                    {STATUS_LABEL[quote.status] ?? quote.status}
                  </span>
                </div>

                <div className="space-y-3 px-6 py-5 text-sm">
                  <div>
                    <p className="text-charcoal">{quote.name}</p>
                    <p className="text-[11px] text-stone-400">
                      {quote.email} · {quote.phone ?? 'sin teléfono'}
                    </p>
                  </div>
                  <p className="leading-relaxed text-stone-500">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-gold-dark">
                      {request.ocasion ?? '—'}
                    </span>
                    {request.descripcion && (
                      <span className="mt-1 block line-clamp-3">{request.descripcion}</span>
                    )}
                  </p>

                  {request.presupuestoOrientativo && (
                    <p className="text-[11px] text-stone-400">
                      Orientativo: {request.presupuestoOrientativo}
                    </p>
                  )}

                  {hasProposal && (
                    <div className="border-t border-line pt-3">
                      <p className="label">Última propuesta</p>
                      <ul className="space-y-1 text-xs">
                        {proposal.items?.map((item, index) => (
                          <li key={index} className="flex justify-between gap-3">
                            <span className="text-charcoal">{item.nombre}</span>
                            <span className="text-stone-500">{formatCents(item.priceCents)}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-right text-sm font-medium text-charcoal">
                        Total {formatCents(latest.subtotalCents)}
                      </p>
                      {latest.acceptedViaWebAt && (
                        <p className="mt-1 text-[11px] text-success">
                          ✅ Aceptada por web el {formatDate(latest.acceptedViaWebAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-auto flex flex-wrap gap-2 border-t border-line px-6 py-4">
                  <button
                    onClick={() => setVersionTarget(quote)}
                    disabled={pending}
                    className="flex flex-1 items-center justify-center gap-1.5 border border-charcoal/25 px-3 py-2.5 text-[10px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {hasProposal ? 'Nueva versión' : 'Armar propuesta'}
                  </button>
                  {quote.status === 'ENVIADA' && (
                    <button
                      onClick={() => mark(quote.id, 'ACLARACION_PENDIENTE')}
                      disabled={pending}
                      className="flex items-center justify-center border border-charcoal/25 px-3 py-2.5 text-[10px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
                    >
                      Pedir aclaración
                    </button>
                  )}
                  {(quote.status === 'ENVIADA' || quote.status === 'ACLARACION_PENDIENTE') && (
                    <button
                      onClick={() => mark(quote.id, 'RECHAZADA')}
                      disabled={pending}
                      className="flex items-center justify-center border border-charcoal/25 px-3 py-2.5 text-[10px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-error hover:text-error disabled:opacity-40"
                    >
                      Rechazar
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {versionTarget && (
        <QuoteVersionModal
          key={versionTarget.id}
          quote={versionTarget}
          onClose={() => setVersionTarget(null)}
        />
      )}
    </div>
  );
}

/** Modal de armado de versión (ítems con precios en ARS; server convierte). */
function QuoteVersionModal({ quote, onClose }: { quote: AdminQuoteView; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState([{ nombre: '', detalle: '', priceArs: 0 }]);
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState(30);

  function updateItem(index: number, field: 'nombre' | 'detalle' | 'priceArs', value: string) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: field === 'priceArs' ? Number(value) : value,
      };
      return next;
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    start(async () => {
      const result = await createQuoteVersion({
        quoteId: quote.id,
        items: items.map((i) => ({
          nombre: i.nombre,
          detalle: i.detalle || undefined,
          priceArs: Math.max(0, Math.round(i.priceArs)),
        })),
        notes: notes.trim() || undefined,
        validDays,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-ivory shadow-luxe"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-ivory px-7 py-5">
          <div className="flex items-center gap-3">
            <Scissors className="h-5 w-5 text-gold-dark" />
            <div>
              <p className="eyebrow">Nueva versión de propuesta</p>
              <p className="font-display text-xl text-charcoal">
                {quote.code} · {quote.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center text-charcoal transition-colors hover:bg-gold/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-7 py-6">
          {items.map((item, index) => (
            <div key={index} className="grid gap-3 border border-line bg-white p-4 sm:grid-cols-[2fr_2fr_1fr]">
              <div>
                <label className="label" htmlFor={`qi-nombre-${index}`}>Ítem</label>
                <input
                  id={`qi-nombre-${index}`}
                  required
                  className="field"
                  value={item.nombre}
                  onChange={(e) => updateItem(index, 'nombre', e.target.value)}
                  placeholder="Vestido en seda mikado"
                />
              </div>
              <div>
                <label className="label" htmlFor={`qi-detalle-${index}`}>Detalle</label>
                <input
                  id={`qi-detalle-${index}`}
                  className="field"
                  value={item.detalle}
                  onChange={(e) => updateItem(index, 'detalle', e.target.value)}
                  placeholder="Forro algodón, botones…"
                />
              </div>
              <div>
                <label className="label" htmlFor={`qi-precio-${index}`}>Precio (ARS)</label>
                <input
                  id={`qi-precio-${index}`}
                  type="number"
                  min={0}
                  step={1000}
                  required
                  className="field"
                  value={item.priceArs || ''}
                  onChange={(e) => updateItem(index, 'priceArs', e.target.value)}
                />
              </div>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                  className="text-left text-[11px] uppercase tracking-[0.14em] text-error hover:underline sm:col-span-3"
                >
                  Quitar ítem
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { nombre: '', detalle: '', priceArs: 0 }])}
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-gold-dark hover:text-charcoal"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar ítem
          </button>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="qv-notes">Notas para la clienta</label>
              <textarea
                id="qv-notes"
                rows={3}
                className="field resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tiempos, pruebas de calce, condiciones…"
              />
            </div>
            <div>
              <label className="label" htmlFor="qv-valid">Válida por (días)</label>
              <input
                id="qv-valid"
                type="number"
                min={1}
                max={120}
                className="field"
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
              />
            </div>
          </div>

          {error && <ErrorNotice message={error} />}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-line bg-ivory px-7 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-charcoal/30 px-6 py-3 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="bg-charcoal px-6 py-3 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft disabled:opacity-40"
          >
            Publicar versión
          </button>
        </div>
      </form>
    </div>
  );
}
