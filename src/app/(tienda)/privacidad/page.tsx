import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacidad y datos',
  description: 'Qué datos guardamos, para qué y cómo ejercer tus derechos (Ley 25.326, Argentina).',
};

/**
 * ⚠️ BORRADOR PARA REVISIÓN DE LA BOUTIQUE.
 * Describe EXACTAMENTE lo que la plataforma guarda hoy (verificado por
 * el desarrollo): nada más, nada menos.
 */
export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 lg:px-10">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-3 font-display text-4xl text-charcoal">Privacidad y datos personales</h1>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-warn">
        Borrador — pendiente de revisión y datos de la boutique
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-stone-600">
        <section>
          <h2 className="font-display text-xl text-charcoal">1. Qué datos guardamos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Cuenta: nombre, email y (si lo cargás) teléfono y medidas corporales.</li>
            <li>Pedidos: dirección de envío, prendas, totales y estado de pago.</li>
            <li>
              Presupuestos: la descripción de tu idea de vestido y la propuesta del atelier.
            </li>
            <li>Consultas: el mensaje que nos enviás desde la web.</li>
          </ul>
          <p className="mt-2">
            No guardamos datos de tarjetas: los pagos los procesa Mercado Pago (cuando esté
            habilitado) o se coordinan por transferencia.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-charcoal">2. Para qué los usamos</h2>
          <p className="mt-2">
            Únicamente para confeccionar y entregar tus vestidos, avisarte el avance del pedido y
            responder tus consultas. No compartimos tus datos con terceros para publicidad.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-charcoal">3. Cookies</h2>
          <p className="mt-2">
            Usamos cookies técnicas de sesión (httpOnly) para mantener tu cuenta abierta de forma
            segura. No hay cookies publicitarias ni de seguimiento.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-charcoal">4. Tus derechos (Ley 25.326)</h2>
          <p className="mt-2">
            Podés pedir acceso, rectificación o eliminación de tus datos escribiendo a
            [EMAIL OFICIAL]. Al eliminarse la cuenta, se conservan únicamente los comprobantes
            exigidos por obligaciones fiscales, por el plazo que fija la normativa vigente.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-charcoal">5. Seguridad</h2>
          <p className="mt-2">
            Las contraseñas se guardan cifradas y jamás las vemos. Cada clienta solo puede ver sus
            propios pedidos y medidas: el acceso se controla en el servidor, no en el navegador.
          </p>
        </section>

        <p className="border border-gold/30 bg-gold/5 px-4 py-3 text-xs text-gold-dark">
          Última actualización: borrador generado por el desarrollo, pendiente de aprobación por
          la boutique.
        </p>
      </div>
    </div>
  );
}
