import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

/**
 * Página de ingreso (Fase 3a). El formulario es un componente cliente
 * envuelto en Suspense porque lee el parámetro ?next con useSearchParams.
 */
export default function LoginPage() {
  return (
    <main>
      <Suspense fallback={<div className="min-h-screen bg-charcoal" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
