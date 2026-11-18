/** @type {import('next').NextConfig} */

// Host de Supabase (para las fotos del Storage) si está configurado.
let supabaseHost = null;
try {
  supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname || null;
} catch {
  supabaseHost = null;
}

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      // Fotos subidas al Storage de Supabase desde el panel (Fase 8).
      ...(supabaseHost ? [{ protocol: 'https', hostname: supabaseHost }] : []),
    ],
  },
};

export default nextConfig;
