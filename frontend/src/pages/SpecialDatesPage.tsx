import { useState, useEffect } from 'react';
import { auraApi, type SpecialDate } from '../api/auraApi';

const TYPE_OPTS = [
  { v: 'anniversary', e: '💍', label: 'Aniversario' },
  { v: 'birthday',    e: '🎂', label: 'Cumpleaños' },
  { v: 'other',       e: '⭐', label: 'Otro' },
];
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function getTypeEmoji(type: string) {
  return TYPE_OPTS.find(t => t.v === type)?.e || '⭐';
}

type View = 'list' | 'form';

export function SpecialDatesPage() {
  const [dates, setDates] = useState<SpecialDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [editing, setEditing] = useState<SpecialDate | null>(null);
  const [form, setForm] = useState({ name: '', month: 1, day: 1, type: 'anniversary', notes: '', reminderDays: 7 });
  const [saving, setSaving] = useState(false);

  const load = () => {
    auraApi.getSpecialDates().then(setDates).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ name: '', month: new Date().getMonth() + 1, day: new Date().getDate(), type: 'anniversary', notes: '', reminderDays: 7 });
    setEditing(null); setView('form');
  };

  const openEdit = (d: SpecialDate) => {
    setForm({ name: d.name, month: d.month, day: d.day, type: d.type, notes: d.notes || '', reminderDays: d.reminderDays });
    setEditing(d); setView('form');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await auraApi.updateSpecialDate(editing.id, form);
      else await auraApi.createSpecialDate(form as any);
      load(); setView('list');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta fecha?')) return;
    await auraApi.deleteSpecialDate(id);
    load();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#ec4899' }}>Cargando...</div>;

  if (view === 'form') return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 16, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#ec4899' }}>‹</button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#be185d' }}>
          {editing ? '✏️ Editar fecha' : '✨ Nueva fecha especial'}
        </h2>
      </div>
      <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Tipo */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Tipo</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {TYPE_OPTS.map(t => (
              <button key={t.v} onClick={() => setForm(f => ({ ...f, type: t.v }))}
                style={{ flex: 1, padding: '10px', borderRadius: 12, border: form.type === t.v ? '2px solid #ec4899' : '2px solid transparent', background: form.type === t.v ? '#fce7f3' : '#f3f4f6', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 24 }}>{t.e}</span>
                <span style={{ fontSize: 11, fontWeight: form.type === t.v ? 700 : 400 }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Nombre */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nombre</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ej: Nuestro aniversario, Cumpleaños de ella..."
            style={{ width: '100%', padding: '10px 12px', border: '2px solid #fce7f3', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {/* Fecha */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Mes</label>
            <select value={form.month} onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))}
              style={{ width: '100%', padding: '10px', border: '2px solid #fce7f3', borderRadius: 10, fontSize: 14, outline: 'none' }}>
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Día</label>
            <input type="number" min={1} max={31} value={form.day} onChange={e => setForm(f => ({ ...f, day: parseInt(e.target.value) }))}
              style={{ width: '100%', padding: '10px', border: '2px solid #fce7f3', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        {/* Recordatorio */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Recordarme con</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,3,7,14].map(n => (
              <button key={n} onClick={() => setForm(f => ({ ...f, reminderDays: n }))}
                style={{ flex: 1, padding: '8px', borderRadius: 10, border: form.reminderDays === n ? '2px solid #ec4899' : '2px solid transparent', background: form.reminderDays === n ? '#fce7f3' : '#f3f4f6', cursor: 'pointer', fontSize: 13, fontWeight: form.reminderDays === n ? 700 : 400 }}>
                {n}d
              </button>
            ))}
          </div>
        </div>
        {/* Notas */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Notas (opcional)</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Ideas para celebrar, qué le gusta recibir..."
            rows={2} style={{ width: '100%', padding: '10px', border: '2px solid #fce7f3', borderRadius: 10, fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button onClick={handleSave} disabled={saving || !form.name}
          style={{ background: '#ec4899', color: 'white', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: saving || !form.name ? 0.6 : 1 }}>
          {saving ? 'Guardando...' : '💾 Guardar'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 16, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#be185d' }}>✨ Fechas Especiales</h2>
        <button onClick={openNew} style={{ background: '#ec4899', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Nueva</button>
      </div>

      {dates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💍</div>
          <p>Agrega fechas importantes para no olvidarlas</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dates.map(d => {
            const urgent = (d.daysUntil || 999) <= d.reminderDays;
            const today = (d.daysUntil || 999) === 0;
            return (
              <div key={d.id} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', borderLeft: `4px solid ${today ? '#ef4444' : urgent ? '#f97316' : '#ec4899'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 22 }}>{getTypeEmoji(d.type)}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{d.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{d.day} de {MONTHS[d.month - 1]}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: today ? '#ef4444' : urgent ? '#f97316' : '#9ca3af', background: today ? '#fef2f2' : urgent ? '#fff7ed' : '#f9fafb', padding: '2px 8px', borderRadius: 8 }}>
                      {today ? '🎉 ¡Hoy!' : `en ${d.daysUntil} días`}
                    </span>
                  </div>
                  {d.notes && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>{d.notes}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(d)} style={{ background: '#fce7f3', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#be185d' }}>✏️</button>
                  <button onClick={() => handleDelete(d.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#ef4444' }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
