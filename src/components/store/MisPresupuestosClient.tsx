'use client';

import { useState, useTransition } from 'react';
import { Check, Clock, Mail, Tag } from 'lucide-react';
import type { AdminQuoteView } from '@/server/admin/quotes';
import { acceptQuoteWeb } from '@/server/store/quote-actions';
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
  ENVIADA: 'En revisión por el taller',
  ACLARACION_PENDIENTE: 'Necesita una aclaración',
  ACEPTADA: 'Aceptado',
  RECHAZADA: 'Rechazado',
};

const STATUS_TONE: Record<string, string> = {
  ENVIADA: 'bg-warn-soft text-warn',
  ACLARACION_PENDIENTE: 'bg-warn-soft text-warn',
  ACEPTADA: 'bg-success-soft text-success',
  RECHAZADA: 'bg-error-soft text-error',
};

/** Presupuestos de la clienta con aceptación web (Fase 5). */
export function MisPresupuestosClient({ quotes }: { quotes: AdminQuoteView[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function accept(quoteId: string) {
    setError(null);
    start(async () => {
      const result = await acceptQuoteWeb(quoteId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-10">
      <div className="text-center">
        <p className="eyebrow">Confección especial</p>
        <h1 className="mt-3 font-display text-4xl text-charcoal">Mis presupuestos</h1>
      </div>

      {error && <ErrorNotice message={error} className="mt-6 justify-center" />}

      {quotes.length === 0 ? (
        <div className="mt-12 border border-line bg-white px-8 py-20 text-center">
          <Tag className="mx-auto h-8 w-8 text-gold/60" />
          <p className="mt-4 font-display text-2xl text-charcoal">Todavía no pediste presupuestos</p>
          <p className="mt-2 text-sm text-stone-500">
            Contanos el vestido que soñás y el taller arma una propuesta.
          </p>
          <a
            href="/presupuesto"
            className="mt-7 inline-block bg-charcoal px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft"
          >
            Pedir un presupuesto
          </a>
        </div>
      ) : (
        <ul className="mt-12 space-y-8">
          {quotes.map((quote) => {
            const latest = quote.versions[quote.versions.length - 1];
            const proposal = (latest?.itemsJson ?? {}) as QuoteVersionJson;
            const request = (quote.versions[0]?.itemsJson ?? {}) as QuoteVersionJson;
            return (
              <li key={quote.id} className="border border-line bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
                  <div>
                    <p className="font-display text-lg tracking-wider text-charcoal">{quote.code}</p>
                    <p className="text-[11px] text-stone-400">
                      Pedido el {formatDate(quote.createdAt)} · {quote.versions.length}{' '}
                      {quote.versions.length === 1 ? 'versión' : 'versiones'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-medium tracking-wide ${STATUS_TONE[quote.status] ?? 'bg-warn-soft text-warn'}`}
                  >
                    {STATUS_LABEL[quote.status] ?? quote.status}
                  </span>
                </div>

                <div className="space-y-4 px-6 py-5">
                  <div className="text-sm">
                    <p className="label">Lo que pediste</p>
                    <p className="text-stone-600">
                      {request.ocasion}
                      {request.fechaEvento ? ` · ${request.fechaEvento}` : ''}
                    </p>
                    <p className="mt-1 leading-relaxed text-stone-500">{request.descripcion}</p>
                  </div>

                  {proposal.tipo === 'propuesta' ? (
                    <div className="border-t border-line pt-4">
                      <p className="label">Propuesta vigente (versión {latest.version})</p>
                      <ul className="mt-2 space-y-2 text-sm">
                        {proposal.items?.map((item, index) => (
                          <li key={index} className="flex justify-between gap-4">
                            <span className="text-charcoal">
                              {item.nombre}
                              {item.detalle && (
                                <span className="block text-[11px] text-stone-400">{item.detalle}</span>
                              )}
                            </span>
                            <span className="text-charcoal">{formatCents(item.priceCents)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-base">
                        <span className="uppercase tracking-[0.18em] text-charcoal">Total</span>
                        <span className="font-medium text-charcoal">
                          {formatCents(latest.subtotalCents)}
                        </span>
                      </div>
                      {latest.notes && (
                        <p className="mt-3 border border-gold/30 bg-gold/5 px-3 py-2 text-xs leading-relaxed text-gold-dark">
                          {latest.notes}
                        </p>
                      )}
                      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-400">
                        <Clock className="h-3 w-3" />
                        {latest.validUntil
                          ? `Válida hasta el ${formatDate(latest.validUntil)}`
                          : 'Sin fecha de validez cargada'}
                      </p>

                      {quote.status !== 'ACEPTADA' && quote.status !== 'RECHAZADA' && (
                        <button
                          onClick={() => accept(quote.id)}
                          disabled={pending}
                          className="mt-4 flex w-full items-center justify-center gap-2 bg-gold px-6 py-3.5 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-light disabled:opacity-40"
                        >
                          <Check className="h-4 w-4" />
                          Aceptar esta propuesta
                        </button>
                      )}
                      {latest.acceptedViaWebAt && (
                        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-success">
                          <Mail className="h-3 w-3" />
                          Aceptada por web el {formatDate(latest.acceptedViaWebAt)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-stone-400">
                      El taller está preparando tu propuesta…
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
