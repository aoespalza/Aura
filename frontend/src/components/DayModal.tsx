import { useState } from 'react';
import type { DailyEntry } from '../api/auraApi';

const MOODS = [
  { v: 1, e: '😤', label: 'Muy mal' },
  { v: 2, e: '😕', label: 'Mal' },
  { v: 3, e: '😐', label: 'Regular' },
  { v: 4, e: '😊', label: 'Bien' },
  { v: 5, e: '😍', label: 'Excelente' },
];

const ENERGY = [
  { v: 1, e: '🪫', label: 'Sin energía' },
  { v: 2, e: '😴', label: 'Cansada' },
  { v: 3, e: '😌', label: 'Normal' },
  { v: 4, e: '⚡', label: 'Activa' },
  { v: 5, e: '🔥', label: 'Con toda' },
];

const DISGUST_CATS = [
  { v: 'comunicacion', label: '🗣️ Comunicación' },
  { v: 'actitud', label: '😒 Actitud' },
  { v: 'economico', label: '💸 Económico' },
  { v: 'domestico', label: '🏠 Doméstico' },
  { v: 'celos', label: '👀 Celos' },
  { v: 'otro', label: '❓ Otro' },
];

const DETAIL_TYPES = [
  { v: 'regalo', label: '🎁 Regalo' },
  { v: 'salida', label: '🍽️ Salida' },
  { v: 'palabras', label: '💌 Palabras bonitas' },
  { v: 'ayuda', label: '🤝 Ayuda' },
  { v: 'sorpresa', label: '✨ Sorpresa' },
  { v: 'otro', label: '💝 Otro' },
];

interface Props {
  date: string;
  entry: DailyEntry | null;
  onSave: (entry: DailyEntry) => void;
  onClose: () => void;
}

export function DayModal({ date, entry, onSave, onClose }: Props) {
  const [form, setForm] = useState<DailyEntry>({
    date,
    mood: 3,
    moodNotes: '',
    hasIntimacy: false,
    intimacyQuality: 3,
    hasDisgust: false,
    disgustReason: '',
    disgustCategory: '',
    disgustIntensity: 3,
    disgustResolved: false,
    isPeriodDay: false,
    periodDayNumber: 1,
    periodSymptoms: '',
    hasDetail: false,
    detailFrom: 'me',
    detailType: '',
    detailDescription: '',
    energyLevel: 3,
    ...(entry || {}),
  });

  const set = (key: keyof DailyEntry, val: any) => setForm(f => ({ ...f, [key]: val }));
  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#be185d', textTransform: 'capitalize' }}>{displayDate}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
        </div>

        {/* Mood */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600, color: '#374151', fontSize: 14 }}>¿Cómo estuvo el día?</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {MOODS.map(m => (
              <button key={m.v} onClick={() => set('mood', m.v)}
                style={{ background: form.mood === m.v ? '#fce7f3' : '#f9fafb', border: form.mood === m.v ? '2px solid #ec4899' : '2px solid transparent', borderRadius: 12, padding: '8px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
                <span style={{ fontSize: 24 }}>{m.e}</span>
                <span style={{ fontSize: 9, color: '#6b7280' }}>{m.label}</span>
              </button>
            ))}
          </div>
          <textarea placeholder="Notas del día..." value={form.moodNotes || ''} onChange={e => set('moodNotes', e.target.value)}
            style={{ width: '100%', marginTop: 10, padding: '10px', border: '1px solid #fce7f3', borderRadius: 10, fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box' }} rows={2} />
        </div>

        {/* Energía */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600, color: '#374151', fontSize: 14 }}>⚡ Nivel de energía</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {ENERGY.map(e => (
              <button key={e.v} onClick={() => set('energyLevel', e.v)}
                style={{ background: form.energyLevel === e.v ? '#fef9c3' : '#f9fafb', border: form.energyLevel === e.v ? '2px solid #eab308' : '2px solid transparent', borderRadius: 12, padding: '8px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
                <span style={{ fontSize: 22 }}>{e.e}</span>
                <span style={{ fontSize: 9, color: '#6b7280' }}>{e.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>

          {/* Intimidad */}
          <div style={{ padding: '12px 16px', background: form.hasIntimacy ? '#fef2f8' : '#f9fafb', borderRadius: 12 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>❤️ Intimidad</span>
              <input type="checkbox" checked={form.hasIntimacy || false} onChange={e => set('hasIntimacy', e.target.checked)} style={{ width: 20, height: 20, accentColor: '#ec4899' }} />
            </label>
            {form.hasIntimacy && (
              <div style={{ marginTop: 10 }}>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6b7280' }}>¿Cómo estuvo? 🔥</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => set('intimacyQuality', n)}
                      style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: (form.intimacyQuality || 3) === n ? '2px solid #ec4899' : '2px solid transparent', background: (form.intimacyQuality || 3) >= n ? '#fce7f3' : '#f3f4f6', cursor: 'pointer', fontSize: 16 }}>
                      {'❤️'.repeat(n > 3 ? 2 : 1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Período */}
          <div style={{ padding: '12px 16px', background: form.isPeriodDay ? '#faf0fe' : '#f9fafb', borderRadius: 12 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>💜 Día de período</span>
              <input type="checkbox" checked={form.isPeriodDay || false} onChange={e => set('isPeriodDay', e.target.checked)} style={{ width: 20, height: 20, accentColor: '#a855f7' }} />
            </label>
            {form.isPeriodDay && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Día del ciclo:</span>
                  <input type="number" min={1} max={10} value={form.periodDayNumber || 1} onChange={e => set('periodDayNumber', parseInt(e.target.value))}
                    style={{ width: 60, padding: '4px 8px', border: '1px solid #e9d5ff', borderRadius: 8, fontSize: 13 }} />
                </div>
                <input placeholder="Síntomas..." value={form.periodSymptoms || ''} onChange={e => set('periodSymptoms', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #e9d5ff', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </div>
            )}
          </div>

          {/* Disgusto */}
          <div style={{ padding: '12px 16px', background: form.hasDisgust ? '#fff7ed' : '#f9fafb', borderRadius: 12 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>😤 Hubo disgusto</span>
              <input type="checkbox" checked={form.hasDisgust || false} onChange={e => set('hasDisgust', e.target.checked)} style={{ width: 20, height: 20, accentColor: '#f97316' }} />
            </label>
            {form.hasDisgust && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input placeholder="Motivo del disgusto..." value={form.disgustReason || ''} onChange={e => set('disgustReason', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 13, outline: 'none' }} />
                {/* Categoría */}
                <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Categoría:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {DISGUST_CATS.map(c => (
                    <button key={c.v} onClick={() => set('disgustCategory', form.disgustCategory === c.v ? '' : c.v)}
                      style={{ padding: '6px 4px', borderRadius: 8, border: form.disgustCategory === c.v ? '2px solid #f97316' : '2px solid transparent', background: form.disgustCategory === c.v ? '#fff7ed' : '#f3f4f6', fontSize: 11, cursor: 'pointer', fontWeight: form.disgustCategory === c.v ? 700 : 400 }}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Intensidad:</span>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => set('disgustIntensity', n)}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: (form.disgustIntensity || 3) >= n ? '#f97316' : '#e5e7eb', cursor: 'pointer', fontSize: 12, color: 'white', fontWeight: 700 }}>{n}</button>
                  ))}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.disgustResolved || false} onChange={e => set('disgustResolved', e.target.checked)} style={{ accentColor: '#22c55e' }} />
                  Se resolvió ✅
                </label>
              </div>
            )}
          </div>

          {/* Detalle */}
          <div style={{ padding: '12px 16px', background: form.hasDetail ? '#f0fdf4' : '#f9fafb', borderRadius: 12 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>🎁 Hubo un detalle</span>
              <input type="checkbox" checked={form.hasDetail || false} onChange={e => set('hasDetail', e.target.checked)} style={{ width: 20, height: 20, accentColor: '#22c55e' }} />
            </label>
            {form.hasDetail && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[['me','De mí'],['her','De ella'],['both','Los dos']].map(([v, l]) => (
                    <button key={v} onClick={() => set('detailFrom', v)}
                      style={{ flex: 1, padding: '6px', borderRadius: 8, border: form.detailFrom === v ? '2px solid #22c55e' : '2px solid transparent', background: form.detailFrom === v ? '#dcfce7' : '#f3f4f6', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>{l}</button>
                  ))}
                </div>
                {/* Tipo de detalle */}
                <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Tipo:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {DETAIL_TYPES.map(t => (
                    <button key={t.v} onClick={() => set('detailType', form.detailType === t.v ? '' : t.v)}
                      style={{ padding: '6px 4px', borderRadius: 8, border: form.detailType === t.v ? '2px solid #22c55e' : '2px solid transparent', background: form.detailType === t.v ? '#dcfce7' : '#f3f4f6', fontSize: 11, cursor: 'pointer', fontWeight: form.detailType === t.v ? 700 : 400 }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <input placeholder="¿Qué fue?" value={form.detailDescription || ''} onChange={e => set('detailDescription', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </div>
            )}
          </div>
        </div>

        <button onClick={() => onSave(form)}
          style={{ width: '100%', background: '#ec4899', color: 'white', border: 'none', borderRadius: 14, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
          💾 Guardar
        </button>
      </div>
    </div>
  );
}
