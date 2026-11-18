import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Condiciones de compra, confección por encargo, pagos y envíos del atelier Venecia.',
};

/**
 * ⚠️ BORRADOR PARA REVISIÓN DE LA BOUTIQUE.
 * Este texto es una base: la dueña debe revisarlo, completar los campos
 * marcados con [CORCHETES] y validar datos fiscales antes de publicar.
 */
export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 lg:px-10">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-3 font-display text-4xl text-charcoal">Términos y condiciones</h1>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-warn">
        Borrador — pendiente de revisión y datos de la boutique
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-stone-600">
        <section>
          <h2 className="font-display text-xl text-charcoal">1. Quiénes somos</h2>
          <p className="mt-2">
            Venecia — Alta Costura, atelier de confección de vestidos hechos a mano, con domicilio en
            [CIUDAD, PROVINCIA], Argentina. Contacto: [EMAIL OFICIAL] · [TELÉFONO/WHATSAPP].
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-charcoal">2. Cómo se compra</h2>
          <p className="mt-2">
            Todas nuestras prendas se confeccionan por encargo. Al confirmar un pedido, el atelier
            agenda la producción y se coordina el pago y los plazos por email. El precio mostrado en
            la web es el vigente al momento del pedido; el total definitivo lo confirma el atelier
            junto con el pago y el envío.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-charcoal">3. Pagos</h2>
          <p className="mt-2">
            Aceptamos transferencia bancaria y Mercado Pago (cuando esté habilitado). Las señas y
            saldos se registran en tu pedido: siempre podés ver el estado de pago desde «Mis
            pedidos». Un comprobante de transferencia queda «por verificar» hasta que el atelier
            confirme el crédito en banco.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-charcoal">4. Confección a medida</h2>
          <p className="mt-2">
            Para prendas a medida necesitamos tus medidas (busto, cintura, cadera y largo). Las
            medidas que guardás en tu perfil se usan para precargar tu confección; los pedidos ya
            realizados conservan siempre las medidas del momento de la compra.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-charcoal">5. Envíos y demoras</h2>
          <p className="mt-2">
            Los plazos de confección son de 3 a 5 semanas según agenda del taller. Los envíos se
            cotizan por destino y se coordinan al confirmar el pedido. El retiro en el atelier está
            sujeto a [DIRECCIÓN Y HORARIOS].
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-charcoal">6. Cambios y ajustes</h2>
          <p className="mt-2">
            Al ser confección por encargo, [POLÍTICA DE CAMBIOS DE LA BOUTIQUE: p. ej. «los vestidos
            a medida no tienen cambio salvo defecto de confección, cubierto por el atelier»]. Los
            ajustes de calce incluyen [CANTIDAD] pruebas según lo acordado.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-charcoal">7. Cancelaciones</h2>
          <p className="mt-2">
            [POLÍTICA DE SEÑAS Y CANCELACIONES: p. ej. «las señas se acreditan como crédito para
            una confección futura si el pedido se cancela antes del corte de tela»].
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
