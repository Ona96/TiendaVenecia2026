'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/Button';
import type { Role } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loginAs = useAuthStore((s) => s.loginAs);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error ?? 'No pudimos validar tus datos.');
      return;
    }
    const normalized = email.trim().toLowerCase();
    const isAdmin = normalized === 'admin@venecia.com';
    router.push(isAdmin ? '/admin' : '/');
    router.refresh();
  }

  function quickAccess(role: Role) {
    setError(null);
    loginAs(role);
    router.push(role === 'ADMIN' ? '/admin' : '/');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-charcoal">
      {/* Panel visual */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://picsum.photos/seed/venecia-login/1200/1600)' }}
        />
        <div className="absolute inset-0 bg-charcoal/70" />
        <div className="relative flex h-full flex-col items-center justify-center px-12 text-center">
          <p className="font-display text-4xl tracking-[0.28em] text-ivory">VENECIA</p>
          <p className="mt-2 text-[10px] uppercase tracking-luxe text-gold">Alta Costura</p>
          <p className="mt-10 max-w-sm text-sm leading-relaxed text-ivory/70">
            Cada vestido empieza con una conversación. Entra para ver tus confecciones, tus medidas
            guardadas o para administrar el taller.
          </p>
        </div>
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
            <h1 className="font-display text-3xl text-ivory">Bienvenida de nuevo</h1>
            <p className="mt-2 text-sm text-ivory/50">
              Ingresá con tu email o usá un acceso rápido de demostración.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="field border-ivory/20 bg-charcoal-soft pl-10 text-ivory placeholder:text-ivory/30 focus:border-gold"
                />
              </div>
            </div>

            {error && (
              <p className="border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-xs text-red-300">
                {error}
              </p>
            )}

            <Button type="submit" variant="gold" size="lg" className="w-full">
              Ingresar
            </Button>
          </form>

          <div className="mt-10 border border-ivory/15 p-5">
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gold">
              <ShieldCheck className="h-4 w-4" />
              Acceso rápido (demo)
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                variant="dark-outline"
                size="sm"
                onClick={() => quickAccess('CLIENTE')}
                className="justify-start"
              >
                <UserRound className="h-4 w-4" />
                Cliente
              </Button>
              <Button
                variant="dark-outline"
                size="sm"
                onClick={() => quickAccess('ADMIN')}
                className="justify-start"
              >
                <ShieldCheck className="h-4 w-4" />
                Administradora
              </Button>
            </div>
            <div className="mt-4 space-y-1.5 text-[11px] leading-relaxed text-ivory/40">
              <p>Cliente: valentina@example.com · cliente123</p>
              <p>Admin: admin@venecia.com · venecia2024</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
