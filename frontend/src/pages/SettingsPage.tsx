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
  const [pinTarget, setPinTarget] = useState<'him' | 'her'>('him');
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
        body: JSON.stringify({ currentPin: pinForm.current, newPin: pinForm.next, target: pinTarget }),
      }).then(async r => { if (!r.ok) throw new Error((await r.json()).error); });
      setPinMsg({ type: 'ok', text: 'PIN cambiado correctamente' });
      setPinForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      setPinMsg({ type: 'err', text: err.message || 'Error al cambiar PIN' });
    }
  };

  // Telegram config
  const [tg, setTg] = useState({ token: '', chatId: '', chatIdHer: '', enabled: false });
  const [tgMsg, setTgMsg] = useState<{ type: 'ok'|'err'; text: string } | null>(null);
  const [tgTesting, setTgTesting] = useState(false);

  useEffect(() => {
    const authToken = localStorage.getItem('aura_token') || '';
    fetch('/api/telegram/config', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.json()).then(d => setTg(d)).catch(() => {});
  }, []);

  const saveTg = async () => {
    const authToken = localStorage.getItem('aura_token') || '';
    const r = await fetch('/api/telegram/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(tg),
    });
    if (r.ok) setTgMsg({ type: 'ok', text: 'Configuración guardada' });
    else setTgMsg({ type: 'err', text: 'Error al guardar' });
    setTimeout(() => setTgMsg(null), 3000);
  };

  const testTg = async () => {
    setTgTesting(true);
    const authToken = localStorage.getItem('aura_token') || '';
    try {
      const r = await fetch('/api/telegram/test', { method: 'POST', headers: { Authorization: `Bearer ${authToken}` } });
      const d = await r.json();
      setTgMsg(d.success ? { type: 'ok', text: '✅ Mensaje enviado' } : { type: 'err', text: d.error || 'Error' });
    } catch { setTgMsg({ type: 'err', text: 'Error de conexión' }); }
    finally { setTgTesting(false); setTimeout(() => setTgMsg(null), 4000); }
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

      {/* Notificaciones navegador */}
      <div style={{ background: 'white', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#374151' }}>🔔 Recordatorio del navegador</h3>

        {!isSecureContext ? (
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#6b7280', border: '1px solid #e5e7eb' }}>
            🔒 Requiere HTTPS — no disponible en este servidor.<br/>
            <strong style={{ color: '#374151' }}>Usa Telegram</strong> (sección de abajo) para notificaciones confiables.
          </div>
        ) : (
          <>
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
                <span style={{ position: 'absolute', inset: 0, borderRadius: 13, background: settings.enabled ? '#ec4899' : '#d1d5db', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: settings.enabled ? 26 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
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
          </>
        )}
      </div>

      {/* Telegram */}
      <div style={{ background: 'white', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#374151' }}>
          ✈️ Notificaciones por Telegram
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#9ca3af' }}>
          1. Bot ya creado: <strong>@AndresyAurabot</strong><br/>
          2. Abre el bot en Telegram y presiona <em>Start</em><br/>
          3. Busca <strong>@userinfobot</strong> → envíale cualquier mensaje → copia tu <em>Id</em>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Token del bot</label>
            <input type="password" value={tg.token} onChange={e => setTg(t => ({ ...t, token: e.target.value }))}
              placeholder="8768703377:AAE..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0f2fe', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>👨 Tu Chat ID (de @userinfobot)</label>
            <input value={tg.chatId} onChange={e => setTg(t => ({ ...t, chatId: e.target.value }))}
              placeholder="Ej: 123456789"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0f2fe', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>👩 Chat ID de ella (de @userinfobot)</label>
            <input value={tg.chatIdHer} onChange={e => setTg(t => ({ ...t, chatIdHer: e.target.value }))}
              placeholder="Ej: 987654321"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #fce7f3', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>
              Ella debe abrir @AndresyAurabot → Start, luego buscar su ID en @userinfobot
            </p>
          </div>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Activar resumen diario (8am)</span>
            <input type="checkbox" checked={tg.enabled} onChange={e => setTg(t => ({ ...t, enabled: e.target.checked }))}
              style={{ width: 20, height: 20, accentColor: '#0088cc' }} />
          </label>

          {tgMsg && (
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: tgMsg.type === 'ok' ? '#16a34a' : '#dc2626' }}>{tgMsg.text}</p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveTg}
              style={{ flex: 1, background: '#0088cc', color: 'white', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              💾 Guardar
            </button>
            <button onClick={testTg} disabled={tgTesting || !tg.chatId}
              style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !tg.chatId ? 0.5 : 1 }}>
              {tgTesting ? 'Enviando...' : '📤 Probar'}
            </button>
          </div>
        </div>
      </div>

      {/* Cambiar PIN */}
      <div style={{ background: 'white', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#374151' }}>🔒 Cambiar PIN</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {([['him','👨 Mi PIN'],['her','👩 PIN de ella']] as ['him'|'her',string][]).map(([v,l]) => (
            <button key={v} type="button" onClick={() => { setPinTarget(v); setPinForm({ current:'', next:'', confirm:'' }); setPinMsg(null); }}
              style={{ flex:1, padding:'8px', borderRadius:10, border:'none', background: pinTarget===v ? '#ec4899' : '#f3f4f6', color: pinTarget===v ? 'white' : '#6b7280', fontWeight:700, fontSize:13, cursor:'pointer' }}>
              {l}
            </button>
          ))}
        </div>
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

