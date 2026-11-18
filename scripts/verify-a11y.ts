/**
 * Verificación a11y estructural (Fase 7) sobre las rutas públicas.
 * Requiere el server corriendo en localhost:3000.
 *
 * Comprueba: idioma, skip-link, landmark main, asociación label/for de
 * inputs, imágenes con alt y presence de las reglas de foco/motion en CSS.
 */
const BASE = 'http://localhost:3000';

const ROUTES = ['/', '/coleccion', '/login', '/presupuesto', '/carrito'];

interface Check {
  name: string;
  ok: boolean;
  detail?: string;
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

async function main() {
  const results: Check[] = [];

  for (const route of ROUTES) {
    const res = await fetch(`${BASE}${route}`);
    const html = await res.text();
    const tag = route === '/' ? 'home' : route.slice(1);

    results.push({
      name: `${tag}: HTTP 200`,
      ok: res.status === 200,
      detail: `HTTP ${res.status}`,
    });
    results.push({
      name: `${tag}: idioma declarado (lang=es)`,
      ok: html.includes('lang="es"'),
    });
    if (!route.startsWith('/login')) {
      results.push({
        name: `${tag}: skip-link al contenido`,
        ok: html.includes('skip-link') && html.includes('Saltar al contenido'),
      });
    }
    results.push({
      name: `${tag}: landmark <main>`,
      ok: html.includes('<main'),
    });

    // Inputs con etiqueta: <label for>, <label> envolvente o aria-label.
    const inputs = count(html, '<input');
    const labelsFor = (html.match(/<label[^>]*for="/g) ?? []).length;
    const wrappedLabels = (html.match(/<label[^>]*>[^<]*<input/g) ?? []).length;
    const ariaLabels = (html.match(/aria-label=/g) ?? []).length;
    results.push({
      name: `${tag}: inputs cubiertos por label/aria-label`,
      ok: inputs <= labelsFor + wrappedLabels + ariaLabels,
      detail: `inputs=${inputs} labels=${labelsFor + wrappedLabels} aria=${ariaLabels}`,
    });

    // Imágenes decorativas/sin alt no permitidas en contenido principal.
    const imgSinAlt = (html.match(/<img(?![^>]*alt=)[^>]*>/g) ?? []).length;
    results.push({
      name: `${tag}: sin <img> sin alt`,
      ok: imgSinAlt === 0,
      detail: `${imgSinAlt} sin alt`,
    });
  }

  // CSS base: foco visible + motion reducido (fuentes del proyecto).
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');
  results.push({
    name: 'CSS: foco de teclado visible (:focus-visible)',
    ok: css.includes(':focus-visible'),
  });
  results.push({
    name: 'CSS: prefers-reduced-motion respetado',
    ok: css.includes('prefers-reduced-motion'),
  });
  results.push({
    name: 'CSS: esqueleto de carga accesible (aria-hidden)',
    ok: css.includes('.skeleton') && readFileSync(
      new URL('../src/components/ui/Skeleton.tsx', import.meta.url),
      'utf8',
    ).includes('aria-hidden'),
  });

  let failed = 0;
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.detail ? ` (${r.detail})` : ''}`);
    if (!r.ok) failed += 1;
  }
  console.log(`\n──────── ${results.length - failed}/${results.length} checks a11y OK ────────`);
  process.exit(failed > 0 ? 1 : 0);
}

void main();
