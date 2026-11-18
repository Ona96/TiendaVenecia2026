'use client';

import { useState, useTransition } from 'react';
import { Check, Ruler } from 'lucide-react';
import type { MyProfileView } from '@/server/store/profile';
import { saveMyMeasurements, updateMyPhone } from '@/server/store/profile-actions';
import { MeasurementsForm, measurementsSummary } from '@/components/store/MeasurementsForm';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { formatDate } from '@/lib/utils';
import type { CustomMeasurements } from '@/lib/types';

/**
 * Perfil real (Fase 5): datos de la cuenta + medidas versionadas.
 * Cada guardado crea UNA versión nueva (append-only): el historial
 * completo queda visible y los pedidos anteriores no cambian nunca.
 */
export function PerfilClient({ profile }: { profile: MyProfileView }) {
  const [pendingMeasure, startMeasure] = useTransition();
  const [pendingPhone, startPhone] = useTransition();
  const [measureError, setMeasureError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [savedMeasure, setSavedMeasure] = useState(false);
  const [savedPhone, setSavedPhone] = useState(false);

  const [measurements, setMeasurements] = useState<CustomMeasurements | null>(null);
  const effective: CustomMeasurements = measurements ?? {
    busto: profile.latest?.busto ?? 0,
    cintura: profile.latest?.cintura ?? 0,
    cadera: profile.latest?.cadera ?? 0,
    largo: profile.latest?.largo ?? 0,
  };

  const [phone, setPhone] = useState(profile.phone ?? '');

  function submitMeasurements(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMeasureError(null);
    setSavedMeasure(false);
    startMeasure(async () => {
      const result = await saveMyMeasurements({
        busto: effective.busto,
        cintura: effective.cintura,
        cadera: effective.cadera,
        largo: effective.largo,
      });
      if (!result.ok) {
        setMeasureError(result.error);
        return;
      }
      setSavedMeasure(true);
      window.setTimeout(() => setSavedMeasure(false), 2500);
    });
  }

  function submitPhone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPhoneError(null);
    setSavedPhone(false);
    startPhone(async () => {
      const result = await updateMyPhone(phone);
      if (!result.ok) {
        setPhoneError(result.error);
        return;
      }
      setSavedPhone(true);
      window.setTimeout(() => setSavedPhone(false), 2500);
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-10">
      <div className="text-center">
        <p className="eyebrow">Mi cuenta</p>
        <h1 className="mt-3 font-display text-4xl text-charcoal">{profile.name}</h1>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {/* Datos */}
        <div className="border border-line bg-white p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-charcoal">Datos de la clienta</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="label">Email</dt>
              <dd className="text-charcoal">{profile.email}</dd>
            </div>
            <div>
              <dt className="label">Rol</dt>
              <dd className="text-charcoal">
                {profile.role === 'ADMIN' ? 'Administradora del atelier' : 'Clienta'}
              </dd>
            </div>
            <div>
              <dt className="label">Cuenta desde</dt>
              <dd className="text-charcoal">{formatDate(profile.createdAt)}</dd>
            </div>
            <div>
              <dt className="label">Pedidos</dt>
              <dd className="text-charcoal">{profile.ordersCount}</dd>
            </div>
          </dl>

          <form onSubmit={submitPhone} className="mt-6">
            <label className="label" htmlFor="phone">
              Teléfono
            </label>
            <div className="flex gap-2">
              <input
                id="phone"
                className="field py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 9 …"
              />
              <button
                type="submit"
                disabled={pendingPhone}
                className="border border-charcoal/25 px-4 text-[10px] uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
              >
                Guardar
              </button>
            </div>
            {savedPhone && (
              <p role="status" className="mt-2 text-[11px] text-success">
                Teléfono actualizado.
              </p>
            )}
            {phoneError && <ErrorNotice message={phoneError} className="mt-2" />}
          </form>
        </div>

        {/* Medidas versionadas */}
        <form onSubmit={submitMeasurements} className="border border-line bg-white p-7">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-charcoal">
            <Ruler className="h-4 w-4 text-gold-dark" />
            Mis medidas
          </p>
          {profile.latest && (
            <p className="mt-2 text-[11px] text-stone-400">
              Vigentes: {measurementsSummary(profile.latest)}
            </p>
          )}

          <div className="mt-5">
            <MeasurementsForm value={effective} onChange={(m) => setMeasurements(m)} />
          </div>

          {measureError && <ErrorNotice message={measureError} className="mt-4" />}

          <button
            type="submit"
            disabled={pendingMeasure}
            className="mt-6 flex w-full items-center justify-center gap-2 bg-charcoal px-6 py-3 text-xs uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal-soft disabled:opacity-40"
          >
            {savedMeasure ? (
              <>
                <Check className="h-4 w-4" />
                Nueva versión guardada
              </>
            ) : (
              'Guardar nueva versión'
            )}
          </button>
          <p className="mt-3 text-center text-[11px] text-stone-400">
            Cada guardado suma una versión: tus pedidos anteriores conservan las medidas de su
            momento.
          </p>

          {profile.history.length > 0 && (
            <div className="mt-6 border-t border-line pt-4">
              <p className="label">Historial ({profile.history.length})</p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-stone-500">
                {profile.history.slice(0, 5).map((entry, index) => (
                  <li key={entry.at} className="flex justify-between gap-2">
                    <span>{measurementsSummary(entry.measurements)}</span>
                    <span className="text-stone-400">
                      {formatDate(entry.at)} · {entry.source === 'WEB' ? 'web' : 'taller'}
                      {index === 0 && ' · vigente'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
