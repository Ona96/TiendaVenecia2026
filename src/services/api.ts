/* ============================================================
   Venecia — Capa de servicios (contrato de datos)
   ------------------------------------------------------------
   Hoy la app corre 100% local: los stores de Zustand persisten
   en localStorage con datos semilla de alta costura, para que
   la demo sea interactiva desde el primer arranque.

   Esta capa define el contrato que usan los stores. Cuando se
   conecte un backend real (Supabase o Prisma/PostgreSQL vía
   Server Actions o Route Handlers), la implementación cambia a
   llamadas HTTP manteniendo exactamente las mismas firmas:

     const api: DataService<Product> = {
       list:   ()            => fetch('/api/products').then((r) => r.json()),
       get:    (id)          => fetch(`/api/products/${id}`).then((r) => r.json()),
       create: (data)        => fetch('/api/products', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.json()),
       update: (id, patch)   => fetch(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).then((r) => r.json()),
       remove: (id)          => fetch(`/api/products/${id}`, { method: 'DELETE' }),
     };

   El resto de la app (stores y componentes) no necesita cambios.
   ============================================================ */

export interface DataService<T> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

/** Colecciones expuestas por el backend cuando se conecte. */
export const serviceCollections = {
  products: 'products',
  orders: 'orders',
  customers: 'customers',
  users: 'users',
} as const;
