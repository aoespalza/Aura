import { useState, useEffect } from 'react';
import { auraApi, type Stats } from '../api/auraApi';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MOOD_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#ec4899'];

export function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [months, setMonths] = useState(3);
  const [prediction, setPrediction] = useState<{ prediction: string | null; avgCycleDays?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    auraApi.getStats(months)
      .then(setStats)
      .catch(e => setError(e?.response?.data?.error || e?.message || 'Error al cargar estadísticas'));
    auraApi.getNextPeriodPrediction().then(setPrediction).catch(() => {});
  }, [months]);

  if (error) return <div style={{ textAlign: 'center', padding: 40, color: '#ef4444', fontSize: 13 }}>⚠️ {error}</div>;
  if (!stats) return <div style={{ textAlign: 'center', padding: 40, color: '#ec4899' }}>Cargando...</div>;

  const moodColor = MOOD_COLOR[Math.round(stats.avgMood)] || '#9ca3af';

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#be185d' }}>📊 Resumen</h2>
        <select value={months} onChange={e => setMonths(parseInt(e.target.value))}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fce7f3', fontSize: 13, color: '#be185d', background: 'white' }}>
          <option value={1}>1 mes</option>
          <option value={3}>3 meses</option>
          <option value={6}>6 meses</option>
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Días registrados', value: stats.total, icon: '📅', color: '#3b82f6' },
          { label: 'Ánimo promedio', value: `${stats.avgMood}/5`, icon: '😊', color: moodColor },
          { label: 'Días de intimidad', value: stats.intimacyDays, icon: '❤️', color: '#ec4899' },
          { label: 'Días de disgusto', value: stats.disgustDays, icon: '😤', color: '#f97316' },
          { label: 'Días de período', value: stats.periodDays, icon: '💜', color: '#a855f7' },
          { label: 'Detalles', value: stats.detailDays, icon: '🎁', color: '#22c55e' },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', borderRadius: 14, padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>{k.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Promedios */}
      <div style={{ background: 'white', borderRadius: 14, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
        <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#374151' }}>📈 Promedios</p>

        {[
          { label: 'Intimidad — calidad', icon: '❤️', color: '#ec4899', avg: stats.avgIntimacyQuality, freq: stats.intimacyPerMonth },
          { label: 'Discusiones — intensidad', icon: '😤', color: '#f97316', avg: stats.avgDisgustIntensity, freq: stats.disgustPerMonth, extra: `${stats.disgustResolvedRate}% resueltas` },
        ].map(row => (
          <div key={row.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: '#4b5563' }}>{row.icon} {row.label}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: row.color }}>{row.avg > 0 ? `${row.avg}/5` : '—'}</span>
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: 8, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(row.avg / 5) * 100}%`, background: row.color, borderRadius: 8, transition: 'width 0.3s' }} />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>
              {row.freq}/mes{row.extra ? ` · ${row.extra}` : ''}
            </p>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: 13, color: '#4b5563' }}>🎁 Detalles — frecuencia</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#22c55e' }}>{stats.detailPerMonth}/mes</span>
        </div>
      </div>

      {/* Correlación período-disgusto */}
      {stats.periodDays > 0 && (
        <div style={{ background: '#fdf4ff', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: '#7e22ce' }}>💜 Correlación período — disgusto</p>
          <div style={{ background: '#e9d5ff', borderRadius: 8, height: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${stats.periodDisgustRate}%`, background: '#a855f7', borderRadius: 8 }} />
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>
            {stats.periodDisgustRate}% de los días de período hubo disgusto
          </p>
        </div>
      )}

      {/* Próximo período */}
      {prediction?.prediction && (
        <div style={{ background: '#fdf2f8', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: '#be185d' }}>🌸 Próximo período estimado</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#ec4899' }}>
            {new Date(prediction.prediction + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {prediction.avgCycleDays && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>Ciclo promedio: {prediction.avgCycleDays} días</p>
          )}
        </div>
      )}

      {/* Mood por día de semana */}
      {Object.keys(stats.moodByWeekday).length > 0 && (
        <div style={{ background: 'white', borderRadius: 14, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#374151' }}>Ánimo promedio por día</p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60 }}>
            {WEEKDAYS.map((d, i) => {
              const val = stats.moodByWeekday[i] || 0;
              const pct = val > 0 ? (val / 5) * 100 : 0;
              return (
                <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', background: val > 0 ? MOOD_COLOR[Math.round(val)] : '#f3f4f6', borderRadius: 4, height: `${pct}%`, minHeight: val > 0 ? 4 : 0, transition: 'height 0.3s' }} />
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>{d}</span>
                  {val > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: MOOD_COLOR[Math.round(val)] }}>{val}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

