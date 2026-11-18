'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { ArrowLeft, CheckCircle2, Scissors } from 'lucide-react';
import { requestQuote, type QuoteRequestInput } from '@/server/store/quote-actions';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { OCCASIONS } from '@/lib/constants';

/**
 * Formulario de presupuesto de confección especial (Fase 5).
 * Público: invitadas también pueden pedirlo. Si hay sesión, el
 * presupuesto queda asociado a la cuenta automáticamente.
 */
export function PresupuestoClient() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ code: string } | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    occasion: OCCASIONS[0] as string,
    eventDate: '',
    description: '',
    fabricIdeas: '',
    budgetHint: '',
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload: QuoteRequestInput = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      occasion: form.occasion.trim(),
      eventDate: form.eventDate.trim() || undefined,
      description: form.description.trim(),
      fabricIdeas: form.fabricIdeas.trim() || undefined,
      budgetHint: form.budgetHint.trim() || undefined,
    };

    start(async () => {
      const result = await requestQuote(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSent({ code: result.code });
      window.scrollTo({ top: 0 });
    });
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center lg:px-10">
        <CheckCircle2 className="mx-auto h-12 w-12 text-gold" />
        <p className="eyebrow mt-6">Solicitud registrada</p>
        <h1 className="mt-3 font-display text-4xl text-charcoal">¡Gracias por contarnos!</h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-500">
          Tu pedido de presupuesto quedó en la mesa del atelier con el código{' '}
          <span className="font-display tracking-wider text-charcoal">{sent.code}</span>. Te vamos a
          responder por email con la propuesta (ítems, tiempos y validez).
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/coleccion"
            className="border border-charcoal/30 px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark"
          >
            Volver a la colección
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 lg:px-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-stone-500 transition-colors hover:text-gold-dark"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a la boutique
      </Link>

      <div className="mt-6 text-center">
        <p className="eyebrow">Confección especial</p>
        <h1 className="mt-3 font-display text-4xl text-charcoal">Pedir presupuesto</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
          ¿Soñás un vestido que no está en el catálogo? Contanos la ocasión y cómo lo imaginás: el
          taller arma una propuesta a medida, con ítems, tiempos y precio.
        </p>
      </div>

      <form onSubmit={submit} className="mt-10 border border-line bg-white p-7">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-charcoal">
          <Scissors className="h-4 w-4 text-gold-dark" />
          Contanos tu idea
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="q-name">Nombre y apellido</label>
            <input
              id="q-name"
              required
              className="field"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Valentina López"
            />
          </div>
          <div>
            <label className="label" htmlFor="q-email">Email</label>
            <input
              id="q-email"
              type="email"
              required
              className="field"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="q-phone">Teléfono / WhatsApp</label>
            <input
              id="q-phone"
              required
              className="field"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+54 9 …"
            />
          </div>
          <div>
            <label className="label" htmlFor="q-occasion">Ocasión</label>
            <select
              id="q-occasion"
              className="field"
              value={form.occasion}
              onChange={(e) => updateField('occasion', e.target.value)}
            >
              {OCCASIONS.map((occasion) => (
                <option key={occasion} value={occasion}>
                  {occasion}
                </option>
              ))}
              <option value="Otra">Otra</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="q-date">Fecha del evento (opcional)</label>
            <input
              id="q-date"
              type="date"
              className="field"
              value={form.eventDate}
              onChange={(e) => updateField('eventDate', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="q-budget">Presupuesto orientativo (opcional)</label>
            <input
              id="q-budget"
              className="field"
              value={form.budgetHint}
              onChange={(e) => updateField('budgetHint', e.target.value)}
              placeholder="Ej.: alrededor de $500.000"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="q-description">¿Cómo imaginás el vestido?</label>
            <textarea
              id="q-description"
              required
              rows={5}
              className="field resize-none"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Escote, caída, largo, bordados, colores, inspiraciones… Contanos todo lo que soñás."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="q-fabrics">Telas o detalles que te gustan (opcional)</label>
            <input
              id="q-fabrics"
              className="field"
              value={form.fabricIdeas}
              onChange={(e) => updateField('fabricIdeas', e.target.value)}
              placeholder="Ej.: encaje francés, seda mikado, espalda abierta…"
            />
          </div>
        </div>

        {error && <ErrorNotice message={error} className="mt-5" />}

        <button
          type="submit"
          disabled={pending}
          className="mt-7 w-full bg-gold px-6 py-4 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-light disabled:opacity-40"
        >
          {pending ? 'Enviando tu solicitud…' : 'Enviar solicitud'}
        </button>
        <p className="mt-3 text-center text-[11px] text-stone-400">
          Respondemos por email con la propuesta versionada: ítems, tiempos y validez.
        </p>
      </form>
    </div>
  );
}
