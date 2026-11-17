/* ============================================================
   Venecia — Modelo de dominio
   Tipos compartidos entre storefront y backoffice.
   ============================================================ */

export type Role = 'CLIENTE' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  /** Solo para la demo local. En producción la contraseña vive hasheada en el backend. */
  password: string;
  role: Role;
  avatarUrl?: string;
}

/** Medidas corporales en centímetros para la confección a medida. */
export interface CustomMeasurements {
  busto: number;
  cintura: number;
  cadera: number;
  largo: number;
}

export type DressCategory = 'NOVIA' | 'FIESTA' | 'COCTEL' | 'GALA' | 'CIVIL' | 'QUINCE';

export type ProductStatus = 'PUBLICADO' | 'PAUSADO';

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Precio en pesos argentinos (ARS). */
  price: number;
  category: DressCategory;
  fabrics: string[];
  occasions: string[];
  /** Talles estándar disponibles además de la confección a medida. */
  sizes: string[];
  /** Capacidad de producción del taller (prendas que se pueden comprometer). */
  stock: number;
  /** Horas de trabajo artesanal por prenda. */
  productionHours: number;
  images: string[];
  featured: boolean;
  status: ProductStatus;
  createdAt: string;
}

export type OrderStatus =
  | 'PENDIENTE'
  | 'EN_CORTE_Y_CONFECION'
  | 'CONTROL_DE_CALIDAD'
  | 'ENVIADO'
  | 'ENTREGADO';

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  /** Talle estándar o 'A_MEDIDA'. */
  size: string;
  quantity: number;
  /** Presente cuando size === 'A_MEDIDA'. */
  measurements?: CustomMeasurements;
}

export interface OrderHistoryEntry {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  /** Código público tipo TV-2025-0001. */
  code: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  shippingAddress: string;
  /** Notas especiales para el taller. */
  workshopNotes?: string;
  createdAt: string;
  updatedAt: string;
  history: OrderHistoryEntry[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  registeredAt: string;
  /** Notas privadas del atelier sobre la clienta. */
  notes?: string;
  /** Medidas guardadas de la última confección. */
  savedMeasurements?: CustomMeasurements;
}

export interface CartItem {
  /** Clave compuesta producto + talle + medidas para permitir variantes. */
  key: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
  measurements?: CustomMeasurements;
}
