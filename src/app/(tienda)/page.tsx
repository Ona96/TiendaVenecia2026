import Link from 'next/link';
import { ArrowRight, Hand, Ruler, Scissors, Sparkles, Truck } from 'lucide-react';
import { NewsletterForm } from '@/components/store/NewsletterForm';
import { FeaturedCollection } from '@/components/store/FeaturedCollection';

const artisanSteps = [
  {
    icon: Ruler,
    step: '01',
    title: 'Mediciones',
    text: 'Tomamos tus medidas y registramos cada detalle del calce. Si es a medida, quedan guardadas en tu perfil para siempre.',
  },
  {
    icon: Scissors,
    step: '02',
    title: 'Corte y confección',
    text: 'La tela se corta a mano sobre molde individual. Cada vestido pasa por un mínimo de 14 horas de costura.',
  },
  {
    icon: Hand,
    step: '03',
    title: 'Acabados y control',
    text: 'Ojales, botones y dobladillos a mano. Antes de salir, cada prenda pasa por control de calidad del atelier.',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero editorial: escenario tipográfico (reemplazable por foto real del atelier) */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden bg-charcoal">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(197, 160, 89, 0.14), transparent 60%), radial-gradient(ellipse 60% 50% at 20% 90%, rgba(197, 160, 89, 0.08), transparent 55%), linear-gradient(160deg, #1a1a1a 0%, #22201c 55%, #2c2618 100%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 flex select-none items-end justify-center overflow-hidden"
        >
          <span className="translate-y-[22%] font-display text-[26vw] leading-none text-ivory/[0.04] lg:text-[20rem]">
            VENECIA
          </span>
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <p className="eyebrow text-gold">Alta Costura · Misiones, Argentina</p>
          <h1 className="mt-6 font-display text-4xl leading-tight text-ivory sm:text-5xl lg:text-6xl">
            Vestidos que se cosen
            <br />
            a mano, uno por uno.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-ivory/70 sm:text-base">
            Atelier boutique de confección por encargo. Telas de seda, encaje francés y acabados que
            solo sobreviven en la costura manual.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/coleccion"
              className="inline-flex items-center gap-2 bg-gold px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-gold-light"
            >
              Explorar la colección
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#artesanal"
              className="inline-flex items-center gap-2 border border-ivory/40 px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:border-gold hover:text-gold"
            >
              Conocer el proceso
            </Link>
          </div>
        </div>
      </section>

      {/* Hecho a mano / Proceso artesanal */}
      <section id="artesanal" className="mx-auto max-w-7xl px-5 py-24 lg:px-10">
        <div className="text-center">
          <p className="eyebrow">Hecho a mano</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal sm:text-4xl">
            El proceso artesanal
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
            Nada sale de serie. Cada vestido nace de una clienta, un molde propio y horas de
            costura a contralupe.
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {artisanSteps.map((step) => (
            <div
              key={step.step}
              className="group border border-line bg-white p-8 text-center transition-all duration-300 hover:shadow-card"
            >
              <span className="font-display text-4xl text-gold/30 transition-colors group-hover:text-gold/60">
                {step.step}
              </span>
              <div className="mx-auto mt-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-gold-dark">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl text-charcoal">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-500">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-y border-line py-5">
          {[
            { icon: Sparkles, label: 'Telas naturales' },
            { icon: Hand, label: 'Costura manual' },
            { icon: Ruler, label: 'Calce de prueba' },
            { icon: Truck, label: 'Envío asegurado' },
          ].map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-charcoal/60"
            >
              <item.icon className="h-4 w-4 text-gold-dark" />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      {/* Adelanto de colección */}
      <section id="coleccion" className="border-t border-line bg-white/60">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Colección vigente</p>
              <h2 className="mt-3 font-display text-3xl text-charcoal sm:text-4xl">
                Destacadas del atelier
              </h2>
            </div>
            <p className="max-w-sm text-sm text-stone-500">
              Talles estándar y confección a medida sobre tus medidas exactas, con cupos limitados
              por temporada.
            </p>
          </div>

          <FeaturedCollection />
        </div>
      </section>

      {/* Confección a medida */}
      <section id="medida" className="mx-auto max-w-7xl px-5 py-24 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden bg-charcoal">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 70% 50% at 30% 20%, rgba(197, 160, 89, 0.16), transparent 60%), linear-gradient(150deg, #1a1a1a 0%, #26221c 60%, #33291a 100%)',
              }}
            />
            <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
              <span
                aria-hidden
                className="font-display text-6xl leading-none text-gold/40 lg:text-7xl"
              >
                V
              </span>
              <p className="mt-4 text-[10px] uppercase tracking-luxe text-ivory/60">
                Tres pruebas de calce
              </p>
              <p className="mt-8 max-w-xs font-display text-2xl leading-snug text-ivory">
                El molde es tuyo y de nadie más.
              </p>
            </div>
            {/* <Image src="/images/atelier-medida.jpg" alt="Confección a medida en el atelier" fill className="object-cover" /> — descomentar cuando exista la foto real */}
          </div>
          <div>
            <p className="eyebrow">A tu cuerpo</p>
            <h2 className="mt-3 font-display text-3xl text-charcoal sm:text-4xl">
              Confección a medida
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-stone-500 sm:text-base">
              Además de los talles estándar, cualquier vestido de la colección se confecciona sobre
              tus medidas exactas: busto, cintura, cadera y largo. Lo indicás en la ficha del
              vestido y el taller trabaja con un molde individual.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Tres pruebas de calce incluidas en CABA y GBA',
                'Medidas guardadas en tu perfil para futuras compras',
                'Envío final en caja de gala con bolsa de algodón',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-charcoal/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-charcoal">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-5 py-20 text-center lg:px-10">
          <p className="eyebrow text-gold">La lista del atelier</p>
          <h2 className="font-display text-3xl text-ivory sm:text-4xl">
            Enterate primero de cada colección
          </h2>
          <p className="text-sm text-ivory/60">
            Abrimos cupos de confección por temporada. Las de la lista eligen antes que nadie.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
