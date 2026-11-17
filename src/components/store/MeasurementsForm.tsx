'use client';

import type { CustomMeasurements } from '@/lib/types';

const MEASUREMENT_FIELDS: { key: keyof CustomMeasurements; label: string }[] = [
  { key: 'busto', label: 'Busto (cm)' },
  { key: 'cintura', label: 'Cintura (cm)' },
  { key: 'cadera', label: 'Cadera (cm)' },
  { key: 'largo', label: 'Largo total (cm)' },
];

export const EMPTY_MEASUREMENTS: CustomMeasurements = {
  busto: 0,
  cintura: 0,
  cadera: 0,
  largo: 0,
};

export function isMeasurementComplete(m?: CustomMeasurements | null): m is CustomMeasurements {
  return (
    !!m &&
    Number.isFinite(m.busto) &&
    Number.isFinite(m.cintura) &&
    Number.isFinite(m.cadera) &&
    Number.isFinite(m.largo) &&
    m.busto > 0 &&
    m.cintura > 0 &&
    m.cadera > 0 &&
    m.largo > 0
  );
}

interface MeasurementsFormProps {
  value: CustomMeasurements;
  onChange: (measurements: CustomMeasurements) => void;
}

export function MeasurementsForm({ value, onChange }: MeasurementsFormProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {MEASUREMENT_FIELDS.map((field) => (
        <div key={field.key}>
          <label className="label" htmlFor={`measure-${field.key}`}>
            {field.label}
          </label>
          <input
            id={`measure-${field.key}`}
            type="number"
            min={40}
            max={200}
            required
            className="field"
            value={value[field.key] || ''}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isNaN(next)) return;
              onChange({ ...value, [field.key]: next });
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function measurementsSummary(m: CustomMeasurements): string {
  return `${m.busto} · ${m.cintura} · ${m.cadera} · ${m.largo}`;
}
