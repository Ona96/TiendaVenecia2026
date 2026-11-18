import { isMercadoPagoConfigured } from '@/server/integrations/mercadopago';
import { CheckoutClient } from '@/components/store/CheckoutClient';

/**
 * Checkout (Fase 6): el Server Component decide si Mercado Pago está
 * activo leyando el entorno (secreto jamás llega al navegador).
 */
export default function CheckoutPage() {
  return <CheckoutClient mpEnabled={isMercadoPagoConfigured()} />;
}
