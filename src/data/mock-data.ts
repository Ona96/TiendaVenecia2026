/* ============================================================
   Venecia — Datos semilla de la demo (REDUCIDA)
   Usuarios, clientas, prendas y pedidos iniciales.
   Se cargan en los stores al primer arranque (localStorage vacío).
   ---
   2026-11-17: por pedido de la boutique, la demo queda con 2 ejemplos
   por sección. La boutique pedirá el borrado completo más adelante:
   ver prisma/seed-clean.ts (DB) y este archivo (mocks).
   ============================================================ */

import type { Customer, Order, Product, User } from '@/lib/types';

export const seedUsers: User[] = [
  {
    id: 'usr_admin',
    name: 'Marcela Ferreyra',
    email: 'admin@venecia.com',
    password: 'venecia2024',
    role: 'ADMIN',
  },
  {
    id: 'usr_valentina',
    name: 'Valentina López',
    email: 'valentina@example.com',
    password: 'cliente123',
    role: 'CLIENTE',
  },
  {
    id: 'usr_julieta',
    name: 'Julieta Ruiz',
    email: 'julieta@example.com',
    password: 'cliente123',
    role: 'CLIENTE',
  },
];

export const seedCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'Valentina López',
    email: 'valentina@example.com',
    phone: '+54 9 11 5550-1021',
    city: 'Palermo, CABA',
    registeredAt: '2025-03-14T10:00:00.000Z',
    notes: 'Prefiere escotes rectos. Alérgica a forros sintéticos: usar siempre algodón.',
    savedMeasurements: { busto: 88, cintura: 66, cadera: 94, largo: 148 },
  },
  {
    id: 'c2',
    name: 'Julieta Ruiz',
    email: 'julieta@example.com',
    phone: '+54 9 11 4478-2210',
    city: 'Recoleta, CABA',
    registeredAt: '2025-04-02T09:30:00.000Z',
    notes: 'Espera su vestido de gala para la boda de oro de su madre.',
    savedMeasurements: { busto: 92, cintura: 71, cadera: 99, largo: 152 },
  },
];

export const seedProducts: Product[] = [
  {
    id: 'p1',
    slug: 'vestido-aurelia',
    name: 'Vestido Aurelia',
    description:
      'Escote recto y espalda abierta en seda mikado. Cada costura se refuerza a mano con puntada invisible. El largo cae exacto a la altura del tobillo para un caminar sereno.',
    price: 890000,
    category: 'NOVIA',
    fabrics: ['Seda mikado'],
    occasions: ['Casamiento', 'Civil'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 4,
    productionHours: 120,
    images: ['/images/products/vestido-aurelia-1.jpg'],
    featured: true,
    status: 'PUBLICADO',
    createdAt: '2025-02-10T09:00:00.000Z',
  },
  {
    id: 'p2',
    slug: 'vestido-serena',
    name: 'Vestido Serena',
    description:
      'Línea siraca con drapeado lateral en satén duchesse. Bordado a mano en la cintura con hilo dorado mate, al tono del logo del atelier.',
    price: 465000,
    category: 'FIESTA',
    fabrics: ['Satén duchesse'],
    occasions: ['Fiesta', 'Graduación'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 6,
    productionHours: 70,
    images: ['/images/products/vestido-serena-1.jpg'],
    featured: true,
    status: 'PUBLICADO',
    createdAt: '2025-02-24T09:00:00.000Z',
  },
];

export const seedOrders: Order[] = [
  {
    id: 'o1',
    code: 'TV-2025-0001',
    customerId: 'c1',
    customerName: 'Valentina López',
    customerEmail: 'valentina@example.com',
    items: [
      {
        productId: 'p1',
        name: 'Vestido Aurelia',
        image: '/images/products/vestido-aurelia-1.jpg',
        price: 890000,
        size: 'A_MEDIDA',
        quantity: 1,
        measurements: { busto: 88, cintura: 66, cadera: 94, largo: 148 },
      },
    ],
    subtotal: 890000,
    shipping: 0,
    total: 890000,
    status: 'EN_CORTE_Y_CONFECION',
    shippingAddress: 'Av. Santa Fe 3200, Palermo, CABA',
    workshopNotes: 'Forro de algodón porque el mikado directo me irrita la piel.',
    createdAt: '2025-09-02T14:10:00.000Z',
    updatedAt: '2025-09-20T10:00:00.000Z',
    history: [
      { status: 'PENDIENTE', at: '2025-09-02T14:10:00.000Z' },
      { status: 'EN_CORTE_Y_CONFECION', at: '2025-09-20T10:00:00.000Z' },
    ],
  },
  {
    id: 'o2',
    code: 'TV-2025-0002',
    customerId: 'c2',
    customerName: 'Julieta Ruiz',
    customerEmail: 'julieta@example.com',
    items: [
      {
        // Snapshot histórico: el Isabella salió del catálogo demo reducido,
        // pero el pedido conserva nombre e imagen (así funciona el archivo).
        productId: 'p3',
        name: 'Vestido Isabella',
        image: '/images/products/vestido-isabella-1.jpg',
        price: 720000,
        size: 'M',
        quantity: 1,
      },
    ],
    subtotal: 720000,
    shipping: 0,
    total: 720000,
    status: 'CONTROL_DE_CALIDAD',
    shippingAddress: 'Juncal 2200, Recoleta, CABA',
    workshopNotes: '',
    createdAt: '2025-08-11T09:40:00.000Z',
    updatedAt: '2025-09-28T15:30:00.000Z',
    history: [
      { status: 'PENDIENTE', at: '2025-08-11T09:40:00.000Z' },
      { status: 'EN_CORTE_Y_CONFECION', at: '2025-08-15T09:00:00.000Z' },
      { status: 'CONTROL_DE_CALIDAD', at: '2025-09-28T15:30:00.000Z' },
    ],
  },
];
