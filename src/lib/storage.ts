'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/env';
import { slugify } from '@/lib/utils';

/**
 * Subida de fotos de productos a Supabase Storage (Fase 8).
 *
 * La admin elige un archivo en el panel; se sube con SU sesión (la
 * política del bucket solo permite escribir a ADMIN) y se devuelve la
 * URL pública que se guarda en product_images.
 *
 * Ruta del objeto: productos/<slug>/<nombre-limpio> (upsert: reemplazar
 * la misma foto no duplica basura).
 */

export const PRODUCTOS_BUCKET = 'productos';

export function publicUrlFor(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${base}/storage/v1/object/public/${PRODUCTOS_BUCKET}/${path}`;
}

export async function uploadProductImage(
  file: File,
  productSlug: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Storage no configurado.' };
  }
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: 'No pudimos iniciar el cliente.' };

  // Nombre limpio y único por contenido: dos fotos distintas no pisan,
  // la misma foto reemplazada sí (upsert).
  const clean = slugify(file.name.replace(/\.[^.]+$/, '')) || 'foto';
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const path = `${productSlug || 'sin-nombre'}/${clean}.${ext}`;

  const { error } = await supabase.storage
    .from(PRODUCTOS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if (error) {
    // Traducción de los errores más comunes.
    const m = error.message.toLowerCase();
    if (m.includes('row-level security') || m.includes('policy')) {
      return {
        ok: false,
        error: 'Tu cuenta no tiene permiso para subir fotos (solo la administradora).',
      };
    }
    if (m.includes('bucket not found')) {
      return { ok: false, error: 'El depósito de fotos no existe todavía.' };
    }
    return { ok: false, error: `No pudimos subir la foto: ${error.message}` };
  }

  return { ok: true, url: publicUrlFor(path) };
}
