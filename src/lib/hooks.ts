'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/**
 * Detecta montaje sin setState en efectos (regla react-hooks v7).
 * Los stores persisten en localStorage: cualquier dato derivado del
 * cliente se renderiza recién montado para evitar mismatches.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, clientSnapshot, serverSnapshot);
}
