import { useState, useEffect } from 'react';
import { auraApi, type PeriodCycle } from '../api/auraApi';

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

type View = 'list' | 'new' | 'edit';

export function CyclePage() {
  const [cycles, setCycles] = useState<PeriodCycle[]>([]);
  const [prediction, setPrediction] = useState<{ prediction: string | null; avgCycleDays?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [editing, setEditing] = useState<PeriodCycle | null>(null);

  // Form
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([auraApi.getPeriodCycles(), auraApi.getNextPeriodPrediction()])
      .then(([c, p]) => { setCycles(c); setPrediction(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setStartDate(today()); setEndDate(''); setNotes('');
    setEditing(null); setView('new');
  };

  const openEdit = (cycle: PeriodCycle) => {
    setStartDate(cycle.startDate.slice(0, 10));
    setEndDate(cycle.endDate?.slice(0, 10) || '');
    setNotes(cycle.notes || '');
    setEditing(cycle); setView('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await auraApi.updatePeriodCycle(editing.id, { endDate: endDate || undefined, notes });
      } else {
        await auraApi.createPeriodCycle({ startDate, endDate: endDate || undefined, notes });
      }
      load(); setView('list');
    } catch { /* error */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este ciclo?')) return;
    await auraApi.deletePeriodCycle(id);
    load();
  };

  // Calcular si hay un ciclo activo (sin fecha fin)
  const activeCycle = cycles.find(c => !c.endDate);

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#a855f7' }}>Cargando...</div>;

  // --- FORMULARIO ---
  if (view === 'new' || view === 'edit') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#a855f7' }}>‹</button>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#7e22ce' }}>
            {view === 'new' ? '💜 Nuevo ciclo' : '✏️ Editar ciclo'}
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>📅 Fecha de inicio</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              disabled={!!editing}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e9d5ff', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', background: editing ? '#f9fafb' : 'white' }} />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              📅 Fecha de fin <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>
            </label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              min={startDate}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e9d5ff', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
            {endDate && startDate && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#a855f7' }}>
                Duración: {daysBetween(startDate, endDate)} días
              </p>
            )}
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>📝 Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Síntomas, observaciones..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e9d5ff', borderRadius: 10, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
          </div>

          <button onClick={handleSave} disabled={saving || !startDate}
            style={{ background: '#a855f7', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Guardando...' : '💾 Guardar'}
          </button>
        </div>
      </div>
    );
  }

  // --- LISTA ---
  const completedCycles = cycles.filter(c => c.endDate && c.duration);
  const avgDuration = completedCycles.length
    ? Math.round(completedCycles.reduce((s, c) => s + (c.duration || 0), 0) / completedCycles.length)
    : null;
  const avgCycle = prediction?.avgCycleDays || null;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#7e22ce' }}>💜 Ciclo Menstrual</h2>
        <button onClick={openNew}
          style={{ background: '#a855f7', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          + Nuevo
        </button>
      </div>

      {/* Ciclo activo */}
      {activeCycle && (
        <div style={{ background: 'linear-gradient(135deg, #f3e8ff, #fdf2f8)', borderRadius: 16, padding: '16px', marginBottom: 16, border: '2px solid #d8b4fe' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: '#7e22ce', fontWeight: 600 }}>🔴 CICLO ACTIVO</p>
              <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#4c1d95' }}>
                Día {daysBetween(activeCycle.startDate.slice(0, 10), today()) + 1} del ciclo
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Inicio: {formatDate(activeCycle.startDate.slice(0, 10))}</p>
            </div>
            <button onClick={() => openEdit(activeCycle)}
              style={{ background: '#a855f7', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Cerrar ciclo
            </button>
          </div>
        </div>
      )}

      {/* Predicción */}
      {prediction?.prediction && (
        <div style={{ background: '#fdf2f8', borderRadius: 14, padding: '14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 12, color: '#be185d', fontWeight: 600 }}>🌸 PRÓXIMO PERÍODO ESTIMADO</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ec4899' }}>
              {formatDate(prediction.prediction)}
            </p>
          </div>
          {avgCycle && (
            <div style={{ textAlign: 'center', background: 'white', borderRadius: 10, padding: '8px 14px' }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#a855f7' }}>{avgCycle}</p>
              <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>días/ciclo</p>
            </div>
          )}
        </div>
      )}

      {/* Stats rápidas */}
      {completedCycles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Ciclos', value: cycles.length },
            { label: 'Duración media', value: avgDuration ? `${avgDuration}d` : '—' },
            { label: 'Ciclo medio', value: avgCycle ? `${avgCycle}d` : '—' },
          ].map(k => (
            <div key={k.label} style={{ background: 'white', borderRadius: 12, padding: '10px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#7e22ce' }}>{k.value}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Historial */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 10px' }}>Historial</h3>
      {cycles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💜</div>
          <p>Aún no hay ciclos registrados</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cycles.map((cycle, i) => (
            <div key={cycle.id} style={{ background: 'white', borderRadius: 14, padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#7e22ce' }}>
                    Ciclo #{cycles.length - i}
                  </span>
                  {!cycle.endDate && <span style={{ fontSize: 10, background: '#f3e8ff', color: '#7e22ce', padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>ACTIVO</span>}
                </div>
                <p style={{ margin: '0 0 2px', fontSize: 13, color: '#374151' }}>
                  {formatDate(cycle.startDate.slice(0, 10))}
                  {cycle.endDate && ` → ${formatDate(cycle.endDate.slice(0, 10))}`}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {cycle.duration && <span style={{ fontSize: 12, color: '#a855f7', fontWeight: 600 }}>{cycle.duration} días</span>}
                  {cycle.notes && <span style={{ fontSize: 12, color: '#9ca3af' }}>{cycle.notes}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(cycle)}
                  style={{ background: '#f3e8ff', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#7e22ce' }}>✏️</button>
                <button onClick={() => handleDelete(cycle.id)}
                  style={{ background: '#fef2f2', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#ef4444' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
