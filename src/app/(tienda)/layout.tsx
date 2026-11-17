import { TopBar } from '@/components/layout/TopBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/store/CartDrawer';

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <TopBar />
      <Header />
      <main id="contenido" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
