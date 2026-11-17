'use client';

/* ============================================================
   Store de autenticación y roles (RBAC)
   Login real contra usuarios semilla + selector rápido de rol
   para pruebas inmediatas. Persiste la sesión en localStorage.
   ============================================================ */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Role, User } from '@/lib/types';
import { seedUsers } from '@/data/mock-data';

interface LoginResult {
  ok: boolean;
  error?: string;
}

interface AuthState {
  users: User[];
  currentUser: User | null;
  login: (email: string, password: string) => LoginResult;
  /** Cambio rápido de rol para demo: inicia sesión como el primer usuario de ese rol. */
  loginAs: (role: Role) => void;
  logout: () => void;
  /**
   * Fase 3a: puente con Supabase. La sesión real (proxy.ts) es la fuente
   * de verdad; este store refleja identidad y rol, no los decide.
   */
  setSessionUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      users: seedUsers,
      currentUser: null,

      login: (email, password) => {
        const normalized = email.trim().toLowerCase();
        const user = seedUsers.find((u) => u.email.toLowerCase() === normalized);
        if (!user) {
          return { ok: false, error: 'No encontramos ese email en el atelier.' };
        }
        if (user.password !== password) {
          return { ok: false, error: 'La contraseña no coincide. Volvé a intentarlo.' };
        }
        set({ currentUser: user });
        return { ok: true };
      },

      loginAs: (role) => {
        const user = seedUsers.find((u) => u.role === role);
        set({ currentUser: user ?? null });
      },

      logout: () => set({ currentUser: null }),
      setSessionUser: (user) => set({ currentUser: user }),
    }),
    {
      name: 'venecia-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentUser: state.currentUser }),
    },
  ),
);

export function selectFirstUserOfRole(role: Role): User | undefined {
  return seedUsers.find((u) => u.role === role);
}
