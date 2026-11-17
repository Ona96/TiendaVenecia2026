import { z } from 'zod';

/**
 * Validación de entrada en el servidor. Toda Server Action valida su input
 * con estos schemas antes de tocar la base de datos.
 */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ingresá un email válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Ingresá tu nombre.'),
    email: z.string().trim().toLowerCase().email('Ingresá un email válido.'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export const recoverySchema = z.object({
  email: z.string().trim().toLowerCase().email('Ingresá un email válido.'),
});

export const addressSchema = z.object({
  label: z.string().trim().min(1, 'Poné un nombre para la dirección (ej. Casa).'),
  name: z.string().trim().min(2),
  phone: z.string().trim().min(6),
  street: z.string().trim().min(5, 'Calle, número y detalles.'),
  city: z.string().trim().min(2),
  province: z.string().trim().min(2),
  postalCode: z.string().trim().max(10).optional().or(z.literal('')),
});

export const measurementsSchema = z.object({
  busto: z.coerce.number().int().min(40).max(200),
  cintura: z.coerce.number().int().min(40).max(200),
  cadera: z.coerce.number().int().min(40).max(200),
  largo: z.coerce.number().int().min(60).max(220),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type MeasurementsInput = z.infer<typeof measurementsSchema>;

/** Respuesta estándar de Server Actions de formulario. */
export type ActionResult = { ok: true } | { ok: false; error: string };
