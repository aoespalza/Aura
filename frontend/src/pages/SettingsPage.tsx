import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auraApi } from '../api/auraApi';

const STORAGE_KEY = 'aura_notif_settings';

interface NotifSettings {
  enabled: boolean;
  time: string; // HH:MM
}

function loadSettings(): NotifSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return { enabled: false, time: '21:00' };
}

function saveSettings(s: NotifSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function getNotifSettings(): NotifSettings {
  return loadSettings();
}

export function SettingsPage() {
  const { logout } = useAuth();
  const [settings, setSettings] = useState<NotifSettings>(loadSettings);
  const [permStatus, setPermStatus] = useState<NotificationPermission>('default');
  const [pinForm, setPinForm] = useState({ current: '', next: '', confirm: '' });
  const [pinMsg, setPinMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if ('Notification' in window) setPermStatus(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) { alert('Tu navegador no soporta notificaciones'); return; }
    const result = await Notification.requestPermission();
    setPermStatus(result);
    if (result === 'granted') {
      const updated = { ...settings, enabled: true };
      setSettings(updated);
      saveSettings(updated);
      scheduleNotification(updated.time);
    }
  };

  const toggleNotif = async (enabled: boolean) => {
    if (enabled && permStatus !== 'granted') { await requestPermission(); return; }
    const updated = { ...settings, enabled };
    setSettings(updated);
    saveSettings(updated);
    if (enabled) scheduleNotification(updated.time);
  };

  const changeTime = (time: string) => {
    const updated = { ...settings, time };
    setSettings(updated);
    saveSettings(updated);
    if (updated.enabled && permStatus === 'granted') scheduleNotification(time);
  };

  const scheduleNotification = (time: string) => {
    // Calcular ms hasta la próxima alarma y guardar en localStorage
    const [h, m] = time.split(':').map(Number);
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    localStorage.setItem('aura_next_alarm', next.toISOString());
  };

  const sendTest = () => {
    if (permStatus !== 'granted') { alert('Activa las notificaciones primero'); return; }
    new Notification('🌸 Aura', {
      body: '¡No olvides registrar cómo fue el día de hoy!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg(null);
    if (pinForm.next !== pinForm.confirm) { setPinMsg({ type: 'err', text: 'Los PINs no coinciden' }); return; }
    if (pinForm.next.length < 4) { setPinMsg({ type: 'err', text: 'El PIN debe tener al menos 4 dígitos' }); return; }
    try {
      const token = localStorage.getItem('aura_token') || '';
      await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPin: pinForm.current, newPin: pinForm.next }),
      }).then(async r => { if (!r.ok) throw new Error((await r.json()).error); });
      setPinMsg({ type: 'ok', text: 'PIN cambiado correctamente' });
      setPinForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      setPinMsg({ type: 'err', text: err.message || 'Error al cambiar PIN' });
    }
  };

  // WhatsApp config
  const [wa, setWa] = useState({ phone: '', apiKey: '', enabled: false });
  const [waMsg, setWaMsg] = useState<{ type: 'ok'|'err'; text: string } | null>(null);
  const [waTesting, setWaTesting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('aura_token') || '';
    fetch('/api/whatsapp/config', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setWa(d)).catch(() => {});
  }, []);

  const saveWa = async () => {
    const token = localStorage.getItem('aura_token') || '';
    const r = await fetch('/api/whatsapp/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(wa),
    });
    if (r.ok) setWaMsg({ type: 'ok', text: 'Configuración guardada' });
    else setWaMsg({ type: 'err', text: 'Error al guardar' });
    setTimeout(() => setWaMsg(null), 3000);
  };

  const testWa = async () => {
    setWaTesting(true);
    const token = localStorage.getItem('aura_token') || '';
    try {
      const r = await fetch('/api/whatsapp/test', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setWaMsg(d.success ? { type: 'ok', text: '✅ Mensaje enviado' } : { type: 'err', text: d.error || 'Error' });
    } catch { setWaMsg({ type: 'err', text: 'Error de conexión' }); }
    finally { setWaTesting(false); setTimeout(() => setWaMsg(null), 4000); }
  };

  // Verificar si hoy está registrado y mostrar badge
  const [todayLogged, setTodayLogged] = useState<boolean | null>(null);
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    auraApi.getEntry(today).then(e => setTodayLogged(!!e));
  }, []);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 800, color: '#be185d' }}>⚙️ Ajustes</h2>

      {/* Estado de hoy */}
      {todayLogged !== null && (
        <div style={{ background: todayLogged ? '#f0fdf4' : '#fff7ed', border: `1px solid ${todayLogged ? '#86efac' : '#fed7aa'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{todayLogged ? '✅' : '📝'}</span>
          <span style={{ fontSize: 14, color: todayLogged ? '#15803d' : '#92400e', fontWeight: 600 }}>
            {todayLogged ? 'Hoy ya está registrado' : 'Aún no registraste el día de hoy'}
          </span>
        </div>
      )}

      {/* Notificaciones */}
      <div style={{ background: 'white', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#374151' }}>🔔 Recordatorio diario</h3>

        {permStatus === 'denied' && (
          <div style={{ background: '#fef2f2', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#dc2626' }}>
            ⚠️ Las notificaciones están bloqueadas. Actívalas en los ajustes del navegador.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#374151' }}>Activar recordatorio</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>
              {permStatus === 'granted' ? '✅ Permisos concedidos' : permStatus === 'denied' ? '❌ Permisos denegados' : '⏳ Sin configurar'}
            </p>
          </div>
          <label style={{ position: 'relative', width: 48, height: 26, cursor: 'pointer' }}>
            <input type="checkbox" checked={settings.enabled} onChange={e => toggleNotif(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: 'absolute', inset: 0, borderRadius: 13,
              background: settings.enabled ? '#ec4899' : '#d1d5db',
              transition: 'background 0.2s',
            }}>
              <span style={{
                position: 'absolute', top: 3, left: settings.enabled ? 26 : 3,
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </span>
          </label>
        </div>

        {settings.enabled && permStatus === 'granted' && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Hora del recordatorio</label>
              <input type="time" value={settings.time} onChange={e => changeTime(e.target.value)}
                style={{ padding: '8px 12px', border: '2px solid #fce7f3', borderRadius: 10, fontSize: 15, outline: 'none', color: '#be185d', fontWeight: 700 }} />
            </div>
            <button onClick={sendTest}
              style={{ background: '#fce7f3', color: '#be185d', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {testSent ? '✅ Enviada!' : '📤 Enviar notificación de prueba'}
            </button>
          </>
        )}
      </div>

      {/* WhatsApp */}
      <div style={{ background: 'white', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#374151' }}>
          <span style={{ fontSize: 20 }}>💬</span> Notificaciones por WhatsApp
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#9ca3af' }}>
          Vía CallMeBot (gratis). Guarda el +34 644 59 21 27 y envíale: <em>"I allow callmebot to send me messages"</em>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Tu número (con código de país)</label>
            <input value={wa.phone} onChange={e => setWa(w => ({ ...w, phone: e.target.value }))}
              placeholder="+573001234567"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #fce7f3', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>API Key de CallMeBot</label>
            <input type="password" value={wa.apiKey} onChange={e => setWa(w => ({ ...w, apiKey: e.target.value }))}
              placeholder="Ej: 123456"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #fce7f3', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Activar resumen diario (8am)</span>
            <input type="checkbox" checked={wa.enabled} onChange={e => setWa(w => ({ ...w, enabled: e.target.checked }))}
              style={{ width: 20, height: 20, accentColor: '#25d366' }} />
          </label>

          {waMsg && (
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: waMsg.type === 'ok' ? '#16a34a' : '#dc2626' }}>{waMsg.text}</p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveWa}
              style={{ flex: 1, background: '#25d366', color: 'white', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              💾 Guardar
            </button>
            <button onClick={testWa} disabled={waTesting || !wa.phone || !wa.apiKey}
              style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !wa.phone || !wa.apiKey ? 0.5 : 1 }}>
              {waTesting ? 'Enviando...' : '📤 Probar'}
            </button>
          </div>
        </div>
      </div>

      {/* Cambiar PIN */}
      <div style={{ background: 'white', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#374151' }}>🔒 Cambiar PIN</h3>
        <form onSubmit={handleChangePin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['current','PIN actual'],['next','Nuevo PIN'],['confirm','Confirmar PIN']].map(([k, label]) => (
            <div key={k}>
              <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>{label}</label>
              <input type="password" inputMode="numeric" maxLength={8}
                value={pinForm[k as keyof typeof pinForm]}
                onChange={e => setPinForm(f => ({ ...f, [k]: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #fce7f3', borderRadius: 10, fontSize: 16, letterSpacing: 4, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
          {pinMsg && (
            <p style={{ margin: 0, fontSize: 13, color: pinMsg.type === 'ok' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{pinMsg.text}</p>
          )}
          <button type="submit"
            style={{ background: '#ec4899', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Cambiar PIN
          </button>
        </form>
      </div>

      {/* Cerrar sesión */}
      <button onClick={logout}
        style={{ width: '100%', background: 'white', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        Cerrar sesión
      </button>
    </div>
  );
}
