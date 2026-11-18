# Fase 8 - Pre-producción (parte automatizable completada)

## Criterios de aceptación (de `docs/AUDITORIA-FASE-0.md`)

> Checklist, contenido real, políticas legales, despliegue **solo con
> autorización**. Sin datos demo expuestos como reales.

## Lo hecho sin depender de la boutique — ✅ (18/11)

### SEO

- `sitemap.ts` dinámico: home, colección, presupuesto, legales + una URL
  por prenda publicada (base `NEXT_PUBLIC_SITE_URL`, en .env/.env.example).
- `robots.ts`: catálogo indexable; admin, api, flujos personales y
  checkout excluidos.
- `metadataBase` + OpenGraph (es_AR) en el layout raíz.
- Metadatos por página: colección, presupuesto, ficha con
  `generateMetadata` (título/descripción desde la base).
- JSON-LD `schema.org/Product` en la ficha (precio ARS + disponibilidad
  real del stock).
- 404 propio con identidad del atelier (antes: default de Next).

### Políticas legales (BORRADOR para revisión de la boutique)

- `/terminos`: cómo se compra, pagos (transferencia/MP), a medida, envíos,
  cambios y cancelaciones — con [CORCHETES] para los datos definitivos.
- `/privacidad`: describe EXACTAMENTE lo que la plataforma guarda hoy
  (cuenta, pedidos, presupuestos, medidas), cookies técnicas httpOnly,
  sin datos de tarjetas, derechos Ley 25.326.
- Enlaces en el footer + sitemap. Marcadas «BORRADOR» en la página misma
  (regla: nada demo expuesto como real).

### Consistencia de contenido demo

- Footer: "Misiones, Argentina" (antes decía Palermo/Buenos Aires,
  inconsistente con el hero) + links legales.

## Verificación

| Prueba | Resultado |
|---|---|
| `/terminos`, `/privacidad`, `/sitemap.xml`, `/robots.txt` | 200 ✅ |
| sitemap incluye prendas + legales | ✅ |
| robots bloquea `/admin` y referencia sitemap | ✅ |
| 404 con marca (HTTP 404 real) | ✅ |
| lint 0 · build ✓ | ✅ |

## Lo que queda de Fase 8 depende de la boutique

Ver **`docs/PENDIENTES-BOUTIQUE.md`** — lista completa y priorizada:
fotos reales, contraseña del admin demo, credenciales MP/email, textos
y datos definitivos, catálogo real, revisión legal, limpieza de demo,
dominio/hosting (despliegue solo con autorización) y recorrida humana.
