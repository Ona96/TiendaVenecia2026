'use client';

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  }

  if (subscribed) {
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-gold">
        <Check className="h-4 w-4" />
        Gracias. Te avisamos cuando abran las próximas confecciones.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-0 border border-ivory/20 p-1">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu email"
        className="w-full bg-transparent px-4 py-2.5 text-sm text-ivory placeholder:text-ivory/40 focus:outline-none"
      />
      <button
        type="submit"
        className="flex items-center gap-2 bg-gold px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-charcoal transition-colors hover:bg-gold-light"
      >
        Sumarme
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
