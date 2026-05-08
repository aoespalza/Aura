import { useState, useEffect, useMemo } from 'react';
import { auraApi, type DailyEntry } from '../api/auraApi';

const INTENSITY_COLOR = ['', '#fca5a5', '#f97316', '#eab308', '#ef4444', '#dc2626'];
const INTENSITY_LABEL = ['', 'Leve', 'Moderado', 'Notable', 'Fuerte', 'Explosivo'];

type Filter = 'all' | 'resolved' | 'unresolved' | 'period';
type Sort = 'date_desc' | 'date_asc' | 'intensity_desc';

export function DisgutsPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('date_desc');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    // Traer todos los meses disponibles — últimos 12 meses
    const promises = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      promises.push(auraApi.getEntries(key));
    }
    Promise.all(promises)
      .then(results => {
        const all = results.flat().filter(e => e.hasDisgust);
        setEntries(all);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...entries];

    // Filtro
    if (filter === 'resolved') list = list.filter(e => e.disgustResolved);
    if (filter === 'unresolved') list = list.filter(e => !e.disgustResolved);
    if (filter === 'period') list = list.filter(e => e.isPeriodDay);

    // Búsqueda
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.disgustReason?.toLowerCase().includes(q));
    }

    // Ordenar
    if (sort === 'date_desc') list.sort((a, b) => b.date.localeCompare(a.date));
    if (sort === 'date_asc') list.sort((a, b) => a.date.localeCompare(b.date));
    if (sort === 'intensity_desc') list.sort((a, b) => (b.disgustIntensity || 0) - (a.disgustIntensity || 0));

    return list;
  }, [entries, filter, sort, search]);

  // Métricas rápidas
  const total = entries.length;
  const resolved = entries.filter(e => e.disgustResolved).length;
  const withPeriod = entries.filter(e => e.isPeriodDay).length;
  const avgIntensity = total
    ? Math.round((entries.reduce((s, e) => s + (e.disgustIntensity || 3), 0) / total) * 10) / 10
    : 0;

  // Motivos más frecuentes
  const reasonCounts: Record<string, number> = {};
  entries.forEach(e => {
    const r = e.disgustReason?.trim();
    if (r) reasonCounts[r] = (reasonCounts[r] || 0) + 1;
  });
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#ec4899' }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>

      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 800, color: '#be185d' }}>😤 Historial de Disgustos</h2>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Total', value: total, color: '#f97316' },
          { label: 'Resueltos', value: `${resolved}/${total}`, color: '#22c55e' },
          { label: 'En período', value: withPeriod, color: '#a855f7' },
          { label: 'Intensidad media', value: `${avgIntensity}/5`, color: '#ef4444' },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', borderRadius: 12, padding: '10px 8px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Top motivos */}
      {topReasons.length > 0 && (
        <div style={{ background: '#fff7ed', borderRadius: 12, padding: '12px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#92400e' }}>🔥 Motivos más frecuentes</p>
          {topReasons.map(([reason, count]) => (
            <div key={reason} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>{reason}</span>
              <span style={{ background: '#f97316', color: 'white', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{count}x</span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {([['all','Todos'],['resolved','Resueltos'],['unresolved','Sin resolver'],['period','En período']] as [Filter,string][]).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ padding: '5px 12px', borderRadius: 20, border: 'none', background: filter === v ? '#ec4899' : '#f3f4f6', color: filter === v ? 'white' : '#374151', fontSize: 12, fontWeight: filter === v ? 700 : 400, cursor: 'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Búsqueda y orden */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Buscar motivo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #fce7f3', borderRadius: 10, fontSize: 13, outline: 'none' }}
        />
        <select value={sort} onChange={e => setSort(e.target.value as Sort)}
          style={{ padding: '8px 10px', border: '1px solid #fce7f3', borderRadius: 10, fontSize: 12, color: '#be185d', background: 'white', outline: 'none' }}>
          <option value="date_desc">Más reciente</option>
          <option value="date_asc">Más antiguo</option>
          <option value="intensity_desc">Mayor intensidad</option>
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🕊️</div>
          <p>No hay disgustos que coincidan</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(entry => {
            const intensity = entry.disgustIntensity || 3;
            const isOpen = expanded === entry.date;
            const date = new Date(entry.date + 'T12:00:00');
            const dateLabel = date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

            return (
              <div key={entry.date}
                onClick={() => setExpanded(isOpen ? null : entry.date)}
                style={{ background: 'white', borderRadius: 14, padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', cursor: 'pointer', borderLeft: `4px solid ${INTENSITY_COLOR[intensity]}` }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>{dateLabel}</span>
                      {entry.isPeriodDay && <span style={{ fontSize: 11, background: '#f3e8ff', color: '#7e22ce', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>💜 período</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>
                      {entry.disgustReason || 'Sin motivo registrado'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ background: `${INTENSITY_COLOR[intensity]}22`, color: INTENSITY_COLOR[intensity], borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      {INTENSITY_LABEL[intensity]}
                    </span>
                    {entry.disgustResolved !== undefined && (
                      <span style={{ fontSize: 11, color: entry.disgustResolved ? '#22c55e' : '#9ca3af' }}>
                        {entry.disgustResolved ? '✅ Resuelto' : '⏳ Sin resolver'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Intensidad visual */}
                <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                  {[1,2,3,4,5].map(n => (
                    <div key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: n <= intensity ? INTENSITY_COLOR[intensity] : '#f3f4f6' }} />
                  ))}
                </div>

                {/* Detalle expandido */}
                {isOpen && entry.moodNotes && (
                  <div style={{ marginTop: 10, padding: '10px', background: '#fdf2f8', borderRadius: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>"{entry.moodNotes}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 11, color: '#d1d5db', marginTop: 16 }}>{filtered.length} de {total} registros</p>
    </div>
  );
}

