import Link from 'next/link';

const collections = ['Novia', 'Fiesta', 'Gala', 'Cóctel', 'Civil', 'Quinceañera'];

const boutique = [
  { label: 'Proceso artesanal', href: '/#artesanal' },
  { label: 'Confección a medida', href: '/#medida' },
  { label: 'Envíos y embalaje', href: '/#artesanal' },
  { label: 'Turnos de prueba', href: '/login' },
];

export function Footer() {
  return (
    <footer className="bg-charcoal text-ivory">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl tracking-[0.28em] text-ivory">VENECIA</p>
            <p className="mt-1 text-[9px] uppercase tracking-luxe text-gold">Alta Costura</p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/60">
              Atelier de vestidos hechos a mano, uno por uno. Telas nobles, costuras reforzadas y
              calces de prueba hasta que quede exacto.
            </p>
          </div>

          <div>
            <p className="eyebrow">Colecciones</p>
            <ul className="mt-4 space-y-2.5">
              {collections.map((c) => (
                <li key={c}>
                  <Link
                    href="/coleccion"
                    className="text-sm text-ivory/70 transition-colors hover:text-gold"
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow">La boutique</p>
            <ul className="mt-4 space-y-2.5">
              {boutique.map((b) => (
                <li key={b.label}>
                  <Link
                    href={b.href}
                    className="text-sm text-ivory/70 transition-colors hover:text-gold"
                  >
                    {b.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow">Contacto</p>
            <ul className="mt-4 space-y-2.5 text-sm text-ivory/70">
              <li>Palermo, Buenos Aires</li>
              <li>hola@venecia.com.ar</li>
              <li>Lun a Vie · 10 a 19 h</li>
              <li>Turnos con cita previa</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-6 sm:flex-row">
          <p className="text-[11px] text-ivory/40">
            © {new Date().getFullYear()} Venecia — Alta Costura. Todos los vestidos se confeccionan
            por encargo.
          </p>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold/70">
            Hecho a mano en Buenos Aires
          </p>
        </div>
      </div>
    </footer>
  );
}
