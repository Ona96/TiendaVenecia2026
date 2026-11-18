import type { DressCategory, OrderStatus } from './types';

export const STORE_NAME = 'Venecia';
export const STORE_TAGLINE = 'Alta Costura';

export const CATEGORIES: { value: DressCategory; label: string }[] = [
  { value: 'NOVIA', label: 'Novia' },
  { value: 'FIESTA', label: 'Fiesta' },
  { value: 'COCTEL', label: 'Cóctel' },
  { value: 'GALA', label: 'Gala' },
  { value: 'CIVIL', label: 'Civil' },
  { value: 'QUINCE', label: 'Quinceañera' },
];

export const CATEGORY_LABEL: Record<DressCategory, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
) as Record<DressCategory, string>;

/** Categorías por slug de la base (Fase 3: el panel habla con slugs). */
export const CATEGORY_SLUGS: { slug: string; label: string }[] = [
  { slug: 'novia', label: 'Novia' },
  { slug: 'fiesta', label: 'Fiesta' },
  { slug: 'coctel', label: 'Cóctel' },
  { slug: 'gala', label: 'Gala' },
  { slug: 'civil', label: 'Civil' },
  { slug: 'quince', label: 'Quinceañera' },
];

export const FABRICS = [
  'Seda mikado',
  'Satén duchesse',
  'Encaje francés',
  'Tul bordado',
  'Crepé de seda',
  'Gasa de seda',
  'Chiffon',
  'Brocado',
] as const;

export const OCCASIONS = [
  'Casamiento',
  'Fiesta',
  'Graduación',
  'Red carpet',
  'Civil',
  'Boda de oro',
] as const;

export const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;

export const CUSTOM_SIZE = 'A_MEDIDA';

export const SHIPPING_FLAT = 3500;
export const FREE_SHIPPING_THRESHOLD = 150000;

export const SHIPPING_PROVINCES = [
  'Ciudad Autónoma de Buenos Aires',
  'GBA Norte',
  'GBA Sur',
  'GBA Oeste',
  'Provincia de Buenos Aires',
  'Córdoba',
  'Santa Fe',
  'Mendoza',
  'Resto del país',
] as const;

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  'PENDIENTE',
  'EN_CORTE_Y_CONFECION',
  'CONTROL_DE_CALIDAD',
  'ENVIADO',
  'ENTREGADO',
];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; description: string; badge: string; dot: string }
> = {
  PENDIENTE: {
    label: 'Pendiente',
    description: 'Pedido recibido, a la espera de confirmación del atelier.',
    badge: 'bg-stone-200 text-stone-700',
    dot: 'bg-stone-400',
  },
  EN_CORTE_Y_CONFECION: {
    label: 'En corte y confección',
    description: 'El taller está cortando y cosiendo tu vestido a mano.',
    badge: 'bg-gold/15 text-gold-dark',
    dot: 'bg-gold',
  },
  CONTROL_DE_CALIDAD: {
    label: 'Control de calidad',
    description: 'Probado puntada por puntada antes de salir del atelier.',
    badge: 'bg-[#EFE3D3] text-[#7A5B22]',
    dot: 'bg-gold-dark',
  },
  ENVIADO: {
    label: 'Enviado',
    description: 'Tu vestido viaja hacia vos con embalaje de gala.',
    badge: 'bg-[#E3E8EC] text-[#41556A]',
    dot: 'bg-[#41556A]',
  },
  ENTREGADO: {
    label: 'Entregado',
    description: 'Pedido entregado. ¡Que lo disfrutes!',
    badge: 'bg-[#E4ECE4] text-[#3F5A3F]',
    dot: 'bg-[#3F5A3F]',
  },
};

export const ROLE_LABEL: Record<string, string> = {
  CLIENTE: 'Cliente',
  ADMIN: 'Administradora',
};
