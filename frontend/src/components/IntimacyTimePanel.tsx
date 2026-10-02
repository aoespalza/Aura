import { useState, useEffect } from 'react';
import { auraApi } from '../api/auraApi';

// Mapa clave-en-BD -> clave-en-localStorage
const DB_KEYS = {
  age: 'profile_age',
  maxAge: 'profile_max_age',
  perEncounter: 'intimacy_min_per_encounter',
} as const;

// Un estudio citado: la pareja promedio acumula ~22 días "en tiempo" (continuos)
// de intimidad en toda su vida. 22 días × 24 h × 60 min = 31 680 minutos.
const MIN_PER_DAY = 24 * 60;
const BENCHMARK_DAYS = 22;
const BENCHMARK_MIN = BENCHMARK_DAYS * MIN_PER_DAY; // 31 680

function load(key: string, def: number): number {
  try {
    const v = localStorage.getItem(key);
    return v != null && v !== '' ? Number(v) : def;
  } catch {
    return def;
  }
}

const nf = (n: number) => Math.round(n).toLocaleString('es-CO');

function humanize(min: number): string {
  if (min < 60) return `${nf(min)} min`;
  const h = min / 60;
  if (h < 24) return `${nf(h)} h`;
  const d = h / 24;
  if (d < 365) return `${(d).toFixed(1)} días`;
  return `${(d / 365).toFixed(1)} años`;
}

export function IntimacyTimePanel({ intimacyDays, months }: { intimacyDays: number; months: number }) {
  const [age, setAge] = useState(() => load('aura_age', 30));
  const [maxAge, setMaxAge] = useState(() => load('aura_maxage', 80));
  const [perEncounter, setPerEncounter] = useState(() => load('aura_minenc', 5));

  // Al montar: traer los valores guardados en la base de datos y sobreescribir el caché local
  useEffect(() => {
    auraApi.getConfig()
      .then(cfg => {
        if (cfg[DB_KEYS.age] != null) setAge(Number(cfg[DB_KEYS.age]));
        if (cfg[DB_KEYS.maxAge] != null) setMaxAge(Number(cfg[DB_KEYS.maxAge]));
        if (cfg[DB_KEYS.perEncounter] != null) setPerEncounter(Number(cfg[DB_KEYS.perEncounter]));
      })
      .catch(() => { /* si falla, se usan los del caché/local */ });
  }, []);

  // Guarda en estado, en localStorage (caché) y en la base de datos (persistente)
  const save = (lsKey: string, dbKey: string, v: number, setter: (n: number) => void) => {
    setter(v);
    try { localStorage.setItem(lsKey, String(v)); } catch { /* noop */ }
    auraApi.setConfig(dbKey, v).catch(() => { /* sin bloquear la UI */ });
  };

  // Acumulado en el rango consultado
  const rangeMin = intimacyDays * perEncounter;

  // Ritmo extrapolado
  const encountersPerYear = months > 0 ? (intimacyDays / months) * 12 : 0;
  const minutesPerYear = encountersPerYear * perEncounter;

  // Proyección hacia adelante
  const yearsRemaining = Math.max(0, maxAge - age);
  const futureMin = minutesPerYear * yearsRemaining;

  // Comparación contra el "promedio de por vida" del estudio
  const favor = futureMin - BENCHMARK_MIN;
  const favorPositive = favor >= 0;

  const inputStyle: React.CSSProperties = {
    width: 56, padding: '4px 6px', borderRadius: 8, border: '1px solid #fbcfe8',
    fontSize: 14, color: '#be185d', textAlign: 'center', background: '#fff',
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 2 };

  return (
    <div style={{ background: 'linear-gradient(135deg,#fdf2f8,#fce7f3)', borderRadius: 14, padding: 16, marginBottom: 16, border: '1px solid #fbcfe8' }}>
      <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: 15, color: '#be185d' }}>⏱️ Tu tiempo de intimidad</p>
      <p style={{ margin: '0 0 14px', fontSize: 11, color: '#9ca3af' }}>
        Proyección estimada a partir de tu ritmo registrado.
      </p>

      {/* Parámetros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Tu edad</label>
          <input type="number" min={10} max={120} value={age}
            onChange={e => save('aura_age', DB_KEYS.age, parseInt(e.target.value) || 0, setAge)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Edad activa máx.</label>
          <input type="number" min={age} max={120} value={maxAge}
            onChange={e => save('aura_maxage', DB_KEYS.maxAge, parseInt(e.target.value) || 0, setMaxAge)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Min/encuentro</label>
          <select value={perEncounter}
            onChange={e => save('aura_minenc', DB_KEYS.perEncounter, parseInt(e.target.value), setPerEncounter)}
            style={{ ...inputStyle, width: 64 }}>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
          </select>
        </div>
      </div>

      {/* Acumulado en el rango */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Últimos {months} {months === 1 ? 'mes' : 'meses'}</p>
        <p style={{ margin: '2px 0 0', fontSize: 14, color: '#374151' }}>
          <b style={{ color: '#ec4899' }}>{intimacyDays}</b> encuentros × {perEncounter} min ={' '}
          <b style={{ color: '#ec4899' }}>{nf(rangeMin)} min</b> <span style={{ color: '#9ca3af' }}>({humanize(rangeMin)})</span>
        </p>
      </div>

      {/* Ritmo y años por delante */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Ritmo estimado</p>
          <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: '#be185d' }}>{nf(encountersPerYear)}/año</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>{nf(minutesPerYear)} min/año</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Años por delante</p>
          <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: '#be185d' }}>{yearsRemaining}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>hasta los {maxAge}</p>
        </div>
      </div>

      {/* Proyección a futuro */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Te quedan por disfrutar (proyectado)</p>
        <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, color: '#ec4899' }}>
          {nf(futureMin)} min
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>≈ {humanize(futureMin)}</p>
      </div>

      {/* Comparación con el estudio */}
      <div style={{ background: favorPositive ? '#f0fdf4' : '#fef2f2', borderRadius: 10, padding: '12px 14px', border: `1px solid ${favorPositive ? '#bbf7d0' : '#fecaca'}` }}>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
          Promedio de una pareja (estudio): <b>{BENCHMARK_DAYS} días</b> = {nf(BENCHMARK_MIN)} min de por vida
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: favorPositive ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
          {favorPositive ? '🎉 A favor: ' : '⚠️ Por debajo: '}
          {nf(Math.abs(favor))} min ({humanize(Math.abs(favor))})
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>
          vs. el promedio de por vida, manteniendo tu ritmo actual hasta los {maxAge} años.
        </p>
      </div>
    </div>
  );
}
