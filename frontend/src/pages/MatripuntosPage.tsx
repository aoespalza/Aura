import { useState, useEffect } from 'react';
import { auraApi, type Points, type Suggestion } from '../api/auraApi';

const PRIORITY_COLOR = { high: '#ef4444', medium: '#f97316', low: '#22c55e' };
const PRIORITY_BG    = { high: '#fef2f2', medium: '#fff7ed', low: '#f0fdf4' };

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function MatripuntosPage() {
  const [points, setPoints] = useState<Points | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(3);

  useEffect(() => {
    setLoading(true);
    Promise.all([auraApi.getPoints(months), auraApi.getSuggestions()])
      .then(([p, s]) => { setPoints(p); setSuggestions(s); })
      .finally(() => setLoading(false));
  }, [months]);

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#ec4899' }}>Cargando...</div>;
  if (!points) return null;

  const { totalPoints, level, nextLevel, progressToNext, breakdown, monthly, periodPoints } = points;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 16, fontFamily: 'system-ui', paddingBottom: 32 }}>

      {/* Header nivel */}
      <div style={{ background: `linear-gradient(135deg, ${level.color}44, ${level.color}22)`, borderRadius: 20, padding: '20px', marginBottom: 16, textAlign: 'center', border: `2px solid ${level.color}66` }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>{level.label.split(' ')[0]}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{level.label.slice(level.label.indexOf(' ') + 1)}</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: level.color, margin: '8px 0' }}>{totalPoints.toLocaleString()}</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>Matripuntos acumulados</div>

        {nextLevel && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
              <span>{level.label.slice(level.label.indexOf(' ') + 1)}</span>
              <span>{nextLevel.label.slice(nextLevel.label.indexOf(' ') + 1)} ({nextLevel.min} pts)</span>
            </div>
            <div style={{ background: '#e5e7eb', borderRadius: 8, height: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressToNext}%`, background: level.color, borderRadius: 8, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              Faltan {nextLevel.min - totalPoints} puntos para el siguiente nivel
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: '#374151' }}>💡 Sugerencias para ti</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{ background: PRIORITY_BG[s.priority], borderRadius: 12, padding: '12px 14px', borderLeft: `4px solid ${PRIORITY_COLOR[s.priority]}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#374151' }}>{s.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desglose del período */}
      <div style={{ background: 'white', borderRadius: 16, padding: '16px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#374151' }}>📊 Puntos ganados</h3>
          <select value={months} onChange={e => setMonths(parseInt(e.target.value))}
            style={{ padding: '4px 8px', border: '1px solid #fce7f3', borderRadius: 8, fontSize: 12, color: '#be185d' }}>
            <option value={1}>1 mes</option>
            <option value={3}>3 meses</option>
            <option value={6}>6 meses</option>
          </select>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#ec4899', marginBottom: 12 }}>+{periodPoints} pts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: '📅 Por registrar días', value: breakdown.days * 2, sub: `${breakdown.days} días × 2` },
            { label: '😊 Días con buen ánimo', value: breakdown.moodBonus, sub: `${breakdown.moodBonus / 2} días × 2` },
            { label: '❤️ Intimidad', value: breakdown.intimacyBonus, sub: `${breakdown.intimacyBonus / 5} días × 5` },
            { label: '🎁 Detalles', value: breakdown.detailBonus, sub: `${breakdown.detailBonus / 10} detalles × 10` },
            { label: '✅ Conflictos resueltos', value: breakdown.resolvedBonus, sub: `${breakdown.resolvedBonus / 4} × 4` },
          ].filter(b => b.value > 0).map(b => (
            <div key={b.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 13 }}>{b.label}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>{b.sub}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#ec4899' }}>+{b.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Historial mensual */}
      <div style={{ background: 'white', borderRadius: 16, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#374151' }}>📈 Historial mensual</h3>
        {(() => {
          const max = Math.max(...monthly.map(m => m.points), 1);
          return (
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
              {monthly.map(m => {
                const [year, mo] = m.month.split('-').map(Number);
                const pct = (m.points / max) * 100;
                return (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: '#ec4899', fontWeight: 700 }}>{m.points > 0 ? m.points : ''}</span>
                    <div style={{ width: '100%', background: m.points > 0 ? '#ec4899' : '#f3f4f6', borderRadius: '4px 4px 0 0', height: `${Math.max(pct, 4)}%`, minHeight: 4, transition: 'height 0.3s' }} />
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>{MONTHS_ES[mo - 1]}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Tabla de puntos */}
      <div style={{ background: '#fdf2f8', borderRadius: 14, padding: '14px', marginTop: 16, fontSize: 12, color: '#6b7280' }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#be185d' }}>Cómo se ganan puntos</p>
        {[
          ['📅 Registrar el día', '+2'],
          ['😊 Día con ánimo ≥ 4', '+2'],
          ['❤️ Intimidad', '+5'],
          ['🎁 Un detalle', '+10'],
          ['✅ Resolver un conflicto', '+4'],
          ['🔥 Racha 3+ días', '+1 extra'],
          ['🔥 Racha 7+ días', '+3 extra'],
        ].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>{l}</span><span style={{ fontWeight: 700, color: '#ec4899' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
