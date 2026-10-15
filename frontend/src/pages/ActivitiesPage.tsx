import { useState, useEffect } from 'react';
import { auraApi, type Activity } from '../api/auraApi';

const CATEGORIES: { v: string; icon: string; label: string }[] = [
  { v: 'familia', icon: '👨‍👩‍👧', label: 'Familia' },
  { v: 'amigos', icon: '🧑‍🤝‍🧑', label: 'Amigos' },
  { v: 'viaje', icon: '✈️', label: 'Viaje' },
  { v: 'cita', icon: '💕', label: 'Cita' },
  { v: 'salida', icon: '🍽️', label: 'Salida' },
  { v: 'casa', icon: '🏠', label: 'Casa' },
  { v: 'otro', icon: '✨', label: 'Otro' },
];
const WHO: { v: string; label: string }[] = [
  { v: 'me', label: 'Yo' }, { v: 'her', label: 'Ella' }, { v: 'both', label: 'Ambos' }, { v: 'other', label: 'Alguien más' },
];
const PAID: { v: string; label: string }[] = [
  { v: 'me', label: 'Yo' }, { v: 'her', label: 'Ella' }, { v: 'shared', label: 'Compartido' }, { v: 'other', label: 'Otro' },
];

const catInfo = (v?: string) => CATEGORIES.find(c => c.v === v);
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate = (s: string) => new Date(s.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

const emptyForm = (): Activity => ({ title: '', category: 'salida', startDate: todayStr(), endDate: '', proposedBy: 'me', paidBy: 'shared', cost: null, rating: null, notes: '' });

export function ActivitiesPage() {
  const [list, setList] = useState<Activity[]>([]);
  const [form, setForm] = useState<Activity>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => auraApi.getActivities().then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  const set = (k: keyof Activity, v: any) => setForm(f => ({ ...f, [k]: v }));

  const startNew = () => { setForm(emptyForm()); setEditId(null); setOpen(true); };
  const startEdit = (a: Activity) => {
    setForm({ ...a, startDate: a.startDate.slice(0, 10), endDate: a.endDate ? a.endDate.slice(0, 10) : '' });
    setEditId(a.id!); setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, cost: form.cost === ('' as any) ? null : form.cost };
      if (editId) await auraApi.updateActivity(editId, payload);
      else await auraApi.createActivity(payload);
      setOpen(false); load();
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => { await auraApi.deleteActivity(id); load(); };

  const input: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #fce7f3', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#be185d' };
  const lbl: React.CSSProperties = { fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4, fontWeight: 600 };
  const chip = (active: boolean): React.CSSProperties => ({ padding: '7px 10px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: active ? '#ec4899' : '#f3f4f6', color: active ? 'white' : '#6b7280' });

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#be185d' }}>🗓️ Actividades</h2>
        <button onClick={startNew} style={{ background: '#ec4899', color: 'white', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Nueva</button>
      </div>

      {list.length === 0 && (
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, marginTop: 32 }}>
          Aún no hay actividades. Registra el tiempo que pasan juntos: viajes, visitas, citas…
        </p>
      )}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map(a => {
          const ci = catInfo(a.category);
          return (
            <div key={a.id} style={{ background: 'white', borderRadius: 14, padding: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#374151' }}>{ci?.icon || '✨'} {a.title}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>
                    {fmtDate(a.startDate)}{a.endDate && a.endDate.slice(0, 10) !== a.startDate.slice(0, 10) ? ` → ${fmtDate(a.endDate)}` : ''}
                    {a.days && a.days > 1 ? ` · ${a.days} días` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => startEdit(a)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => remove(a.id!)} style={{ background: '#fef2f2', border: 'none', borderRadius: 8, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {a.proposedBy && <span style={{ fontSize: 11, color: '#6b7280', background: '#faf5ff', borderRadius: 6, padding: '2px 8px' }}>Propuso: {WHO.find(w => w.v === a.proposedBy)?.label}</span>}
                {a.paidBy && <span style={{ fontSize: 11, color: '#6b7280', background: '#f0fdf4', borderRadius: 6, padding: '2px 8px' }}>Pagó: {PAID.find(w => w.v === a.paidBy)?.label}{a.cost ? ` ($${a.cost.toLocaleString('es-CO')})` : ''}</span>}
                {a.rating ? <span style={{ fontSize: 11, color: '#f59e0b', background: '#fffbeb', borderRadius: 6, padding: '2px 8px' }}>{'★'.repeat(a.rating)}</span> : null}
              </div>
              {a.notes && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#6b7280' }}>{a.notes}</p>}
            </div>
          );
        })}
      </div>

      {/* Modal formulario */}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#be185d' }}>{editId ? 'Editar actividad' : 'Nueva actividad'}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>¿Qué hicieron?</label>
                <input style={input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej. Fin de semana con su familia" />
              </div>

              <div>
                <label style={lbl}>Categoría</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CATEGORIES.map(c => (
                    <button key={c.v} onClick={() => set('category', c.v)} style={chip(form.category === c.v)}>{c.icon} {c.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Desde</label>
                  <input type="date" style={input} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Hasta (opcional)</label>
                  <input type="date" style={input} value={form.endDate || ''} onChange={e => set('endDate', e.target.value)} />
                </div>
              </div>

              <div>
                <label style={lbl}>¿Quién lo propuso / invitó?</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {WHO.map(w => <button key={w.v} onClick={() => set('proposedBy', w.v)} style={chip(form.proposedBy === w.v)}>{w.label}</button>)}
                </div>
              </div>

              <div>
                <label style={lbl}>¿Quién pagó?</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PAID.map(w => <button key={w.v} onClick={() => set('paidBy', w.v)} style={chip(form.paidBy === w.v)}>{w.label}</button>)}
                </div>
                <input type="number" inputMode="numeric" style={{ ...input, marginTop: 8 }} placeholder="Costo (opcional)" value={form.cost ?? ''} onChange={e => set('cost', e.target.value === '' ? null : Number(e.target.value))} />
              </div>

              <div>
                <label style={lbl}>¿Qué tal estuvo?</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => set('rating', form.rating === n ? null : n)}
                      style={{ fontSize: 26, background: 'none', border: 'none', cursor: 'pointer', filter: (form.rating || 0) >= n ? 'none' : 'grayscale(1) opacity(0.4)' }}>★</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>Notas (opcional)</label>
                <textarea style={{ ...input, minHeight: 60, resize: 'vertical' }} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setOpen(false)} style={{ flex: 1, background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={save} disabled={saving || !form.title.trim()} style={{ flex: 2, background: '#ec4899', color: 'white', border: 'none', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving || !form.title.trim() ? 0.6 : 1 }}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
