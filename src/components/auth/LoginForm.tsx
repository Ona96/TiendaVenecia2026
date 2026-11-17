'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, KeyRound, Mail, UserRound } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/env';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/ui/ErrorNotice';

/**
 * Login y registro reales (Fase 3a).
 *
 * Sin Supabase configurado (modo demo explícito) se muestra un aviso:
 * el store de demo ya no finge autenticación desde aquí.
 */

type Mode = 'login' | 'register';

/** Traduce los errores más comunes de Supabase a español rioplatense. */
function traducirError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.';
  }
  if (m.includes('email not confirmed')) {
    return 'Tenés que confirmar tu email antes de entrar. Revisá tu casilla (también el spam).';
  }
  if (m.includes('user already registered')) {
    return 'Ese email ya tiene una cuenta. Probá iniciar sesión.';
  }
  if (m.includes('rate limit')) {
    return 'Demasiados intentos seguidos. Esperá un momento y probá de nuevo.';
  }
  return message;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get('next') ?? '/';

  const supabaseConfigured = isSupabaseConfigured();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function cambiarModo(nuevo: Mode) {
    setMode(nuevo);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (!supabaseConfigured) {
        setError('Modo demo: el login real necesita las credenciales de Supabase en .env.');
        return;
      }
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setError('No pudimos iniciar el cliente de autenticación.');
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (mode === 'register') {
        if (password.length < 8) {
          setError('La contraseña necesita al menos 8 caracteres.');
          return;
        }
        const { data, error: err } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { data: { name: name.trim() || normalizedEmail.split('@')[0] } },
        });
        if (err) {
          setError(traducirError(err.message));
          return;
        }
        if (data.session) {
          // Auto-confirmado: sesión inmediata.
          router.push(nextPath);
          router.refresh();
        } else {
          setInfo(
            '¡Listo! Te enviamos un email para confirmar tu cuenta. Confirmalo y volvé a entrar.',
          );
          cambiarModo('login');
        }
        return;
      }

      const { error: err } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (err) {
        setError(traducirError(err.message));
        return;
      }
      router.push(nextPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-charcoal">
      {/* Panel visual */}
      <div className="relative hidden w-1/2 overflow-hidden bg-charcoal lg:block">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 65% 25%, rgba(197, 160, 89, 0.18), transparent 60%), radial-gradient(ellipse 50% 40% at 25% 85%, rgba(197, 160, 89, 0.10), transparent 55%), linear-gradient(165deg, #1a1a1a 0%, #211e18 55%, #2b2418 100%)',
          }}
        />
        <div className="relative flex h-full flex-col items-center justify-center px-12 text-center">
          <p className="font-display text-4xl tracking-[0.28em] text-ivory">VENECIA</p>
          <p className="mt-2 text-[10px] uppercase tracking-luxe text-gold">Alta Costura</p>
          <span aria-hidden className="mt-8 h-px w-16 bg-gold/50" />
          <p className="mt-8 max-w-sm text-sm leading-relaxed text-ivory/70">
            Cada vestido empieza con una conversación. Entra para ver tus confecciones, tus medidas
            guardadas o para administrar el taller.
          </p>
        </div>
        {/* <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/images/login-atelier.jpg)' }} /> — descomentar cuando exista la foto real */}
      </div>

      {/* Formulario */}
      <div className="flex w-full items-center justify-center px-6 py-16 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ivory/50 transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a la boutique
          </Link>

          <div className="mt-10 text-center lg:text-left">
            <h1 className="font-display text-3xl text-ivory">
              {mode === 'login' ? 'Bienvenida de nuevo' : 'Creá tu cuenta'}
            </h1>
            <p className="mt-2 text-sm text-ivory/50">
              {mode === 'login'
                ? 'Ingresá con tu email para ver tus pedidos y medidas.'
                : 'Registrá tu email para seguir tus confecciones desde el primer día.'}
            </p>
          </div>

          {/* Selector de modo */}
          <div className="mt-8 grid grid-cols-2 gap-1 border border-ivory/15 p-1">
            <button
              type="button"
              onClick={() => cambiarModo('login')}
              aria-pressed={mode === 'login'}
              className={
                mode === 'login'
                  ? 'bg-gold px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-charcoal'
                  : 'px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory/60 transition-colors hover:text-gold'
              }
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => cambiarModo('register')}
              aria-pressed={mode === 'register'}
              className={
                mode === 'register'
                  ? 'bg-gold px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-charcoal'
                  : 'px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ivory/60 transition-colors hover:text-gold'
              }
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="label text-ivory/50">
                  Nombre
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/30" />
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Valentina López"
                    className="field border-ivory/20 bg-charcoal-soft pl-10 text-ivory placeholder:text-ivory/30 focus:border-gold"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="label text-ivory/50">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/30" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="field border-ivory/20 bg-charcoal-soft pl-10 text-ivory placeholder:text-ivory/30 focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label text-ivory/50">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/30" />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={mode === 'register' ? 8 : undefined}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
                  className="field border-ivory/20 bg-charcoal-soft pl-10 text-ivory placeholder:text-ivory/30 focus:border-gold"
                />
              </div>
            </div>

            {error && <ErrorNotice message={error} />}

            {info && (
              <p
                role="status"
                className="border border-gold/30 bg-gold/10 px-4 py-2.5 text-xs leading-relaxed text-gold-light"
              >
                {info}
              </p>
            )}

            <Button type="submit" variant="gold" size="lg" className="w-full" isLoading={loading}>
              {mode === 'login' ? 'Ingresar' : 'Crear mi cuenta'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
