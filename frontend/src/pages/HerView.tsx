import { useState, useEffect } from 'react';
import { auraApi, type DailyEntry } from '../api/auraApi';
import { useAuth } from '../context/AuthContext';

const MOODS = [
  { v: 1, e: '😤', label: 'Muy mal' },
  { v: 2, e: '😕', label: 'Mal' },
  { v: 3, e: '😐', label: 'Regular' },
  { v: 4, e: '😊', label: 'Bien' },
  { v: 5, e: '😍', label: 'Excelente' },
];
const ENERGY = [
  { v: 1, e: '🪫' }, { v: 2, e: '😴' }, { v: 3, e: '😌' }, { v: 4, e: '⚡' }, { v: 5, e: '🔥' },
];
const MOOD_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#ec4899'];

function todayStr() { return new Date().toISOString().slice(0, 10); }
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }
function formatMonth(date: Date) {
  return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export function HerView() {
  const { logout } = useAuth();
  const today = todayStr();
  const yesterday = yesterdayStr();
  const [current, setCurrent] = useState(new Date());
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [targetDate, setTargetDate] = useState<'yesterday' | 'today'>('yesterday');
  const [view, setView] = useState<'home' | 'calendar'>('home');

  // Form del día objetivo
  const [herMood, setHerMood] = useState(3);
  const [herEnergy, setHerEnergy] = useState(3);
  const [herNotes, setHerNotes] = useState('');
  const [isPeriod, setIsPeriod] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeDate = targetDate === 'yesterday' ? yesterday : today;

  const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    auraApi.getEntry(activeDate).then(e => {
      setHerMood((e as any)?.herMood || 3);
      setHerEnergy((e as any)?.herEnergyLevel || 3);
      setHerNotes((e as any)?.herNotes || '');
      setIsPeriod(e?.isPeriodDay || false);
    });
  }, [activeDate]);

  useEffect(() => {
    auraApi.getEntries(monthKey).then(setEntries);
  }, [monthKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await auraApi.saveEntry({
        date: activeDate,
        mood: 3,
        herMood,
        herEnergyLevel: herEnergy,
        herNotes,
        isPeriodDay: isPeriod,
      } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const entryMap = new Map(entries.map(e => [e.date.slice(0, 10), e]));
  const firstDay = new Date(current.getFullYear(), current.getMonth(), 1).getDay();
  const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  const days: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'white', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fce7f3' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#be185d' }}>🌸 Aura — Tu vista</span>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}>Salir</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #fce7f3' }}>
        {[['home','🏠 Hoy'],['calendar','📅 Calendario']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v as any)}
            style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontSize: 14, fontWeight: view === v ? 700 : 400, color: view === v ? '#ec4899' : '#9ca3af', borderBottom: view === v ? '3px solid #ec4899' : '3px solid transparent', cursor: 'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 420, margin: '0 auto', padding: 16, paddingBottom: 32 }}>

        {/* VISTA INICIO — registro de hoy */}
        {view === 'home' && (
          <div>
            {/* Selector de día */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button onClick={() => setTargetDate('yesterday')}
                style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: targetDate === 'yesterday' ? '#ec4899' : '#f3f4f6', color: targetDate === 'yesterday' ? 'white' : '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                📋 Ayer
              </button>
              <button onClick={() => setTargetDate('today')}
                style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: targetDate === 'today' ? '#a855f7' : '#f3f4f6', color: targetDate === 'today' ? 'white' : '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                🔄 Avance hoy
              </button>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#be185d', margin: '0 0 20px' }}>
              {targetDate === 'yesterday' ? '¿Cómo estuvo ayer?' : '¿Cómo vas hoy?'}
            </h2>

            {saved && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '10px 16px', marginBottom: 16, fontSize: 14, color: '#15803d', fontWeight: 600 }}>
                ✅ ¡Guardado!
              </div>
            )}

            {/* Mood */}
            <div style={{ background: 'white', borderRadius: 16, padding: '16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#374151' }}>😊 Tu estado de ánimo</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {MOODS.map(m => (
                  <button key={m.v} onClick={() => setHerMood(m.v)}
                    style={{ flex: 1, background: herMood === m.v ? '#fce7f3' : '#f9fafb', border: herMood === m.v ? '2px solid #ec4899' : '2px solid transparent', borderRadius: 12, padding: '10px 4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 26 }}>{m.e}</span>
                    <span style={{ fontSize: 9, color: '#6b7280' }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energía */}
            <div style={{ background: 'white', borderRadius: 16, padding: '16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#374151' }}>⚡ Tu energía</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {ENERGY.map(e => (
                  <button key={e.v} onClick={() => setHerEnergy(e.v)}
                    style={{ flex: 1, padding: '12px 4px', borderRadius: 12, border: herEnergy === e.v ? '2px solid #eab308' : '2px solid transparent', background: herEnergy === e.v ? '#fef9c3' : '#f9fafb', cursor: 'pointer', fontSize: 26, display: 'flex', justifyContent: 'center' }}>
                    {e.e}
                  </button>
                ))}
              </div>
            </div>

            {/* Período */}
            <div style={{ background: 'white', borderRadius: 16, padding: '16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>💜 Estoy en mi período</span>
                <input type="checkbox" checked={isPeriod} onChange={e => setIsPeriod(e.target.checked)}
                  style={{ width: 22, height: 22, accentColor: '#a855f7' }} />
              </label>
            </div>

            {/* Notas */}
            <div style={{ background: 'white', borderRadius: 16, padding: '16px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: '#374151' }}>📝 Algo que quieras anotar</p>
              <textarea value={herNotes} onChange={e => setHerNotes(e.target.value)}
                placeholder="¿Cómo te sentiste hoy? ¿Algo especial?"
                rows={3}
                style={{ width: '100%', padding: '10px', border: '1px solid #fce7f3', borderRadius: 10, fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <button onClick={handleSave} disabled={saving}
              style={{ width: '100%', background: '#ec4899', color: 'white', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Guardando...' : '💾 Guardar mi día'}
            </button>

            {/* Vista del día según él */}
            {(() => {
              const e = entryMap.get(activeDate);
              if (!e?.mood) return null;
              return (
                <div style={{ marginTop: 20, background: 'white', borderRadius: 16, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>📖 Lo que él registró</p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 32 }}>{['','😤','😕','😐','😊','😍'][e.mood]}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>
                        Te vio {['','muy mal 😢','mal','regular','bien 😊','excelente 😍'][e.mood]}
                      </p>
                      {e.moodNotes && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>"{e.moodNotes}"</p>}
                    </div>
                  </div>
                  {e.hasDetail && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#15803d' }}>
                      🎁 {e.detailDescription || 'Hubo un detalle'}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* VISTA CALENDARIO */}
        {view === 'calendar' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#ec4899' }}>‹</button>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#be185d', textTransform: 'capitalize' }}>{formatMonth(current)}</h3>
              <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#ec4899' }}>›</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 6 }}>
              {['D','L','M','X','J','V','S'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', padding: '4px 0', fontWeight: 600 }}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {days.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const entry = entryMap.get(dateStr);
                const isToday = dateStr === today;
                const herMoodVal = (entry as any)?.herMood;
                return (
                  <div key={dateStr} style={{
                    aspectRatio: '1', borderRadius: 10, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '4px 2px',
                    background: herMoodVal ? `${MOOD_COLOR[herMoodVal]}22` : isToday ? '#fce7f3' : '#f9fafb',
                    border: isToday ? '2px solid #ec4899' : '1px solid transparent',
                  }}>
                    <span style={{ fontSize: 11, color: isToday ? '#be185d' : '#374151', fontWeight: isToday ? 700 : 400 }}>{day}</span>
                    {herMoodVal && <span style={{ fontSize: 14 }}>{['','😤','😕','😐','😊','😍'][herMoodVal]}</span>}
                    <div style={{ display: 'flex', gap: 1 }}>
                      {entry?.isPeriodDay && <span style={{ fontSize: 8 }}>💜</span>}
                      {entry?.hasDetail && <span style={{ fontSize: 8 }}>🎁</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leyenda */}
            <div style={{ marginTop: 12, display: 'flex', gap: 12, justifyContent: 'center', fontSize: 11, color: '#6b7280' }}>
              <span>💜 Período</span><span>🎁 Detalle de él</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
