'use client';

import { useState, useTransition } from 'react';
import { Layers, Plus, Save } from 'lucide-react';
import type { FabricView } from '@/server/admin/fabrics';
import { createFabric, updateFabricDescription, setFabricArchived } from '@/server/admin/actions';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { cn } from '@/lib/utils';

/**
 * Gestión de telas del catálogo (Fase 7).
 * Nombre inmutable tras crear (integridad de prendas/pedidos),
 * descripción editable, archivo en vez de borrado.
 */
export function TelasClient({ fabrics }: { fabrics: FabricView[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editing, setEditing] = useState<{ id: string; descripcion: string } | null>(null);
  const [savedEdit, setSavedEdit] = useState<string | null>(null);

  function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!newName.trim()) return;
    start(async () => {
      const result = await createFabric({
        nombre: newName,
        descripcion: newDesc.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNewName('');
      setNewDesc('');
    });
  }

  function saveDescription() {
    if (!editing) return;
    setError(null);
    start(async () => {
      const result = await updateFabricDescription(editing.id, editing.descripcion);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedEdit(editing.id);
      setEditing(null);
      window.setTimeout(() => setSavedEdit(null), 2500);
    });
  }

  function toggleArchived(fabric: FabricView) {
    setError(null);
    start(async () => {
      const result = await setFabricArchived(fabric.id, !fabric.archived);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="p-6 lg:p-10">
      <div>
        <p className="eyebrow">Catálogo</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Telas del atelier</h1>
        <p className="mt-2 text-sm text-stone-500">
          {fabrics.length} telas · {fabrics.filter((f) => !f.archived).length} activas · el nombre
          es definitivo tras crear (prendas y pedidos lo guardan como texto)
        </p>
      </div>

      {error && <ErrorNotice message={error} className="mt-4" />}
      {savedEdit && (
        <p role="status" className="mt-4 text-xs text-success">
          Descripción actualizada.
        </p>
      )}

      {/* Alta */}
      <form onSubmit={create} className="mt-8 border border-line bg-white p-6">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-charcoal">
          <Plus className="h-4 w-4 text-gold-dark" />
          Nueva tela
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="fabric-name">Nombre (único e inmutable)</label>
            <input
              id="fabric-name"
              required
              minLength={2}
              maxLength={60}
              className="field"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej.: Organza de seda"
            />
          </div>
          <div>
            <label className="label" htmlFor="fabric-desc">Descripción (editable)</label>
            <div className="flex gap-2">
              <input
                id="fabric-desc"
                className="field"
                maxLength={300}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Cuerpo, caída, para qué sirve…"
              />
              <button
                type="submit"
                disabled={pending}
                className="border border-charcoal/25 px-5 text-[10px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Listado */}
      <ul className="mt-6 divide-y divide-line border border-line bg-white">
        {fabrics.length === 0 && (
          <li className="px-6 py-10 text-center text-sm text-stone-400">
            Todavía no hay telas cargadas. Creá la primera arriba.
          </li>
        )}
        {fabrics.map((fabric) => (
          <li
            key={fabric.id}
            className={cn(
              'flex flex-wrap items-center justify-between gap-4 px-6 py-4',
              fabric.archived && 'opacity-60',
            )}
          >
            <div className="min-w-[240px] flex-1">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gold-dark" aria-hidden />
                <p className="text-sm text-charcoal">{fabric.nombre}</p>
                {fabric.isDemo && (
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-gold-dark">
                    demo
                  </span>
                )}
                {fabric.enUso > 0 && (
                  <span className="text-[11px] text-stone-400">
                    {fabric.enUso} {fabric.enUso === 1 ? 'prenda' : 'prendas'}
                  </span>
                )}
              </div>

              {editing?.id === fabric.id ? (
                <div className="mt-2 flex gap-2">
                  <input
                    className="field py-2"
                    value={editing.descripcion}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, descripcion: e.target.value } : prev,
                      )
                    }
                    maxLength={300}
                    aria-label={`Descripción de ${fabric.nombre}`}
                  />
                  <button
                    onClick={saveDescription}
                    disabled={pending}
                    className="flex items-center gap-1.5 border border-charcoal/25 px-4 text-[10px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Guardar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() =>
                    setEditing({ id: fabric.id, descripcion: fabric.descripcion ?? '' })
                  }
                  className="mt-1 text-left text-xs text-stone-500 transition-colors hover:text-gold-dark"
                >
                  {fabric.descripcion ?? 'Sin descripción — tocar para editar'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]',
                  fabric.archived ? 'bg-error-soft text-error' : 'bg-success-soft text-success',
                )}
              >
                {fabric.archived ? 'Archivada' : 'Activa'}
              </span>
              <button
                onClick={() => toggleArchived(fabric)}
                disabled={pending}
                className="border border-charcoal/25 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
              >
                {fabric.archived ? 'Restaurar' : 'Archivar'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
