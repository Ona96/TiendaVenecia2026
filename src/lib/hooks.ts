'use client';

import { useEffect, useState } from 'react';

/**
 * Evita mismatches de hidratación: los stores persisten en localStorage,
 * así que cualquier dato derivado del cliente se renderiza recién montado.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
