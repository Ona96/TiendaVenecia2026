# PENDIENTES DE LA BOUTIQUE — todo lo que falta y depende de vos

Última actualización: 18/11/2026 (limpieza de la demo completa; resta
MP/email/dominio/despliegue). El desarrollo está completo y verificado; lo
que queda está ordenado por prioridad.

## 1. 📸 Fotos reales de las prendas (ME BLOQUEA EL LOOK FINAL)

**✅ INTEGRADO (18/11): subís las fotos desde el propio panel — así le
agarrás la mano al sistema:**

1. Entrá a `/admin` → **Prendas** → editá la prenda (o creala).
2. En «Fotos de la prenda», tocá **«Subir»** y elegí el archivo de tu
   computadora (JPG/PNG/WebP). La foto va al depósito en la nube del
   atelier (Supabase Storage) y la ruta se completa sola.
3. Guardá: la foto aparece en la colección y la ficha al instante.
   Subí hasta 3 vistas por prenda; la primera es la principal.

Reglas de seguridad ya verificadas (5/5 pruebas): solo la administradora
puede subir; una clienta queda bloqueada; el público ve las fotos sin
sesión. Convención alternativa para lotes grandes: si preferís arrastrar
archivos a mano en tu máquina local, `public/images/products/<slug>-1.jpg`
también funciona — pero **en producción la única vía es el botón Subir**
(el hosting no permite escribir archivos en el servidor).

Ideal: vertical 3:4, buena luz, fondo limpio. Mientras no haya foto, la
ficha muestra un panel elegante del atelier (nunca una foto rota).

## 2. ✅ Acceso admin resuelto (18/11)

La cuenta demo `admin@venecia.com` se ELIMINÓ con la limpieza (ítem 8). La
única cuenta del sistema es la real de la boutique: `kvnrenott@gmail.com`
(registrada, email confirmado, rol ADMIN verificado). Sin acciones pendientes.

## 3. 📱 Mercado Pago (credenciales sandbox)

developers.mercadopago.com.ar → Crear aplicación → pasame:
- `MP_ACCESS_TOKEN` (token de prueba)
- `MP_WEBHOOK_SECRET` (Cuenta > Integraciones)
- Decidir URL pública (dominio o túnel para probar local)
Con eso activo el botón de MP y hago la compra sandbox de punta a punta.

## 4. ✉️ Proveedor de email transaccional

Elegir uno (Resend / Brevo / SMTP propio) y pasarme las 2 credenciales:
`EMAIL_PROVIDER_URL` + `EMAIL_PROVIDER_API_KEY`. Hoy los emails (confirmación
de pedido, propuesta de presupuesto, pago verificado) se registran con marca
[EMAIL-STUB] y NO se envían de verdad.

## 5. ✍️ Textos y datos reales de la boutique

Hoy hay textos editoriales de desarrollo (hero, proceso artesanal, footer).
Pasame los definitivos: descripción del atelier, horarios, dirección,
email oficial, WhatsApp, ciudad (el pie dice "Misiones, Argentina" —
confirmar), redes sociales, y los textos de la home. Los cambio yo.

## 6. 🧵 Contenido real del catálogo

- Crear tus prendas reales desde `/admin/prendas` (precios, talles, telas).
- Las 2 prendas demo (Aurelia y Serena) se borran/archivan cuando quieras.
- Telas: en `/admin/telas` archivá las que no uses y creá las tuyas.

## 7. ⚖️ Revisión legal (borradores listos para tu revisión)

- `/terminos` y `/privacidad`: leerlos, completar los [CORCHETES]
  (domicilio, email oficial, política de cambios/señas/cancelaciones,
  dirección del atelier) y aprobar. Están marcados como BORRADOR.

## 8. ✅ Limpieza de la demo (HECHO: 18/11, autorizado por la boutique)

- `npm run db:seed:clean`: 24 filas demo eliminadas (2 prendas, 8 telas,
  6 categorías, 3 colecciones, 1 promoción, 4 CMS; no había pedidos,
  presupuestos ni pagos demo).
- Mocks del código vaciados (`src/data/mock-data.ts`, seeds a []).
- Cuentas demo borradas del auth: `admin@venecia.com` y
  `valentina@demo.venecia` (`scripts/cleanup-demo.ts`, con guardas).
  Única cuenta restante: `kvnrenott@gmail.com` (ADMIN).
- Verificado: build de producción OK con catálogo vacío, tests de unidad
  14/14, lint OK.
- ⚠️ Los tests de integración (`npm run test:db`) esperaban la demo: desde
  ahora exigen una base de DESARROLLO con seed (proyecto Supabase aparte).
  No correrlos contra la base de producción.

## 9. 🚀 Despliegue (SOLO con tu autorización, según protocolo)

Decisiones tuyas:
- **Dominio**: comprar/elegir (ej. venecia.com.ar).
- **Hosting**: recomendado Vercel (Next.js nativo, plan gratis arranca).
- **Base**: usar este mismo proyecto Supabase (limpiando demo) o crear uno
  nuevo de producción. Yo preparo el checklist de variables y ejecuto el
  primer despliegue cuando autorices.

## 10. 🔍 Recorrida humana final (30-45 min recomendados)

- Registrarte como clienta de prueba, comprar, ver "mis pedidos".
- Pedir un presupuesto y aceptarlo desde "mis presupuestos".
- Panel: crear/editar/archivar una prenda, gestionar telas, mover el estado
  de tu pedido de prueba y registrar una seña.
- Recorrido por teclado (Tab) y, si podés, lector de pantalla (NVDA).
- Cualquier detalle que no te guste: lo anoto y lo corrijo.

## 11. (Opcional) Google OAuth

Solo si lo querés: crear credenciales OAuth de Google y las cableo
(quedó como stub marcado desde la auditoría).

## 12. (Después de sandbox OK) Mercado Pago producción

Misma integración, credenciales de producción + webhook con firma
verificada + primera compra real controlada.
