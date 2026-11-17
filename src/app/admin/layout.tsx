'use client';

/* ============================================================
   Guardia de rutas del backoffice: /admin/* es exclusivo de ADMIN.
   Si no hay sesión o el rol no corresponde, redirige.
   ============================================================ */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Scissors } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { AdminShell } from '@/components/admin/AdminShell';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const authorized = currentUser?.role === 'ADMIN';

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    if (!authorized) {
      router.replace('/');
    }
  }, [currentUser, authorized, router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory">
        <Scissors className="h-6 w-6 animate-pulse text-gold" />
        <p className="text-[11px] uppercase tracking-luxe text-stone-400">
          Verificando acceso al atelier…
        </p>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
