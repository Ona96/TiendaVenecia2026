-- Catálogo de telas gestionado por la admin (backlog Fase 4 → integrado 18/11).
-- Diseño:
--  * nombre UNIQUE e inmutable tras crear (prendas/pedidos guardan texto).
--  * archived en vez de borrado: integridad comercial.
--  * isDemo para el contenido demo limpiable.
CREATE TABLE "fabrics" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),

    CONSTRAINT "fabrics_pkey" PRIMARY KEY ("id")
);

-- Único por nombre (case-insensitive no se fuerza: el action normaliza).
CREATE UNIQUE INDEX "fabrics_nombre_key" ON "fabrics"("nombre");

-- RLS: lectura pública (la faceta de la colección la consume anónimamente);
-- escrituras solo por el backend (Prisma/acciones del panel).
ALTER TABLE public.fabrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fabrics_public_read" ON public.fabrics;
CREATE POLICY "fabrics_public_read" ON public.fabrics
  FOR SELECT USING (true);
