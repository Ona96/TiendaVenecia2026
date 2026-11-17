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
  title: {
    default: 'Venecia — Alta Costura',
    template: '%s · Venecia',
  },
  description:
    'Boutique de vestidos de alta costura hechos a mano. Confección a medida, telas nobles y acabados de atelier.',
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
