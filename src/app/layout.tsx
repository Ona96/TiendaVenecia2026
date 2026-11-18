import type { Metadata } from 'next';
import { Playfair_Display, Jost } from 'next/font/google';
import { SessionBridge } from '@/components/auth/SessionBridge';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Venecia — Alta Costura',
    template: '%s · Venecia',
  },
  description:
    'Boutique de vestidos de alta costura hechos a mano. Confección a medida, telas nobles y acabados de atelier.',
  openGraph: {
    siteName: 'Venecia — Alta Costura',
    locale: 'es_AR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${jost.variable}`}>
      <body>
        <SessionBridge />
        {children}
      </body>
    </html>
  );
}
