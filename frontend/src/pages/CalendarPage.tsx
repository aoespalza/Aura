import { useState, useEffect } from 'react';
import { auraApi, type DailyEntry } from '../api/auraApi';
import { DayModal } from '../components/DayModal';

const MOOD_EMOJI = ['', '😤', '😕', '😐', '😊', '😍'];
const MOOD_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#ec4899'];

function formatMonth(date: Date) {
  return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    setLoading(true);
    auraApi.getEntries(monthKey)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [monthKey]);

  const entryMap = new Map(entries.map(e => [e.date.slice(0, 10), e]));

  const firstDay = new Date(current.getFullYear(), current.getMonth(), 1).getDay();
  const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const days: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const handlePrev = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const handleNext = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const handleDayClick = (day: number) => {
    const date = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(date);
  };

  const handleSave = (entry: DailyEntry) => {
    auraApi.saveEntry(entry).then(() => {
      auraApi.getEntries(monthKey).then(setEntries);
      setSelectedDate(null);
    });
  };

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header navegación */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={handlePrev} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#ec4899' }}>‹</button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#be185d', textTransform: 'capitalize' }}>
          {formatMonth(current)}
        </h2>
        <button onClick={handleNext} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#ec4899' }}>›</button>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, fontSize: 11, color: '#6b7280' }}>
        <span>💜 Período</span><span>❤️ Intimidad</span><span>😤 Disgusto</span><span>🎁 Detalle</span>
      </div>

      {/* Días de semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {['D','L','M','X','J','V','S'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#9ca3af', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Grilla */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#ec4899' }}>Cargando...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {days.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const entry = entryMap.get(dateStr);
            const isToday = dateStr === today;
            const isFuture = dateStr > today;

            return (
              <div key={dateStr}
                onClick={() => !isFuture && handleDayClick(day)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isFuture ? 'default' : 'pointer',
                  background: entry ? `${MOOD_COLOR[entry.mood]}22` : isToday ? '#fce7f3' : '#f9fafb',
                  border: isToday ? '2px solid #ec4899' : '1px solid transparent',
                  opacity: isFuture ? 0.35 : 1,
                  position: 'relative',
                  gap: 2,
                  padding: '4px 2px',
                  transition: 'transform 0.1s',
                }}>
                <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? '#be185d' : '#374151' }}>{day}</span>
                {entry && <span style={{ fontSize: 14 }}>{MOOD_EMOJI[entry.mood]}</span>}
                {entry && (
                  <div style={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {entry.isPeriodDay && <span style={{ fontSize: 8 }}>💜</span>}
                    {entry.hasIntimacy && <span style={{ fontSize: 8 }}>❤️</span>}
                    {entry.hasDisgust && <span style={{ fontSize: 8 }}>😤</span>}
                    {entry.hasDetail && <span style={{ fontSize: 8 }}>🎁</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedDate && (
        <DayModal
          date={selectedDate}
          entry={entryMap.get(selectedDate) || null}
          onSave={handleSave}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
