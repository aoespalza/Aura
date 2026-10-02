import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auraApi, type Invite } from '../api/auraApi';

export function LinkPartnerPage() {
  const { user, logout, refresh } = useAuth();
  const [toEmail, setToEmail] = useState('');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadInvites = () => {
    auraApi.getInvites().then(setInvites).catch(() => {});
  };
  useEffect(() => { loadInvites(); }, []);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMsg(''); setLoading(true);
    try {
      await auraApi.inviteCouple(toEmail);
      setMsg(`Invitación enviada a ${toEmail}. Cuando la acepte, quedarán enlazados.`);
      setToEmail('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo enviar la invitación.');
    } finally { setLoading(false); }
  };

  const accept = async (id: string) => {
    setError(''); setLoading(true);
    try { await auraApi.acceptInvite(id); await refresh(); }
    catch (err: any) { setError(err?.response?.data?.error || 'No se pudo aceptar.'); setLoading(false); }
  };

  const reject = async (id: string) => {
    try { await auraApi.rejectInvite(id); loadInvites(); } catch { /* noop */ }
  };

  const card: React.CSSProperties = { background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', fontSize: 15, border: '2px solid #fce7f3', borderRadius: 12, outline: 'none', marginBottom: 12, boxSizing: 'border-box', color: '#be185d' };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#fdf2f8,#fce7f3)', fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>💑</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#be185d', margin: '4px 0' }}>Enlaza a tu pareja</h1>
          <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
            Hola{user?.name ? ` ${user.name}` : ''} ({user?.email}). Para empezar, conéctate con tu pareja.
          </p>
        </div>

        {/* Invitaciones recibidas */}
        {invites.length > 0 && (
          <div style={card}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#be185d' }}>📨 Invitaciones para ti</p>
            {invites.map(inv => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderTop: '1px solid #fce7f3' }}>
                <span style={{ fontSize: 13, color: '#374151' }}>
                  {inv.from?.name || inv.from?.email || 'Alguien'} te invitó
                </span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => accept(inv.id)} disabled={loading}
                    style={{ background: '#ec4899', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Aceptar</button>
                  <button onClick={() => reject(inv.id)}
                    style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>Rechazar</button>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Enviar invitación */}
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#be185d' }}>✉️ Invitar por email</p>
          <form onSubmit={sendInvite}>
            <input type="email" placeholder="Email de tu pareja" value={toEmail}
              onChange={e => setToEmail(e.target.value)} style={inputStyle} required />
            {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 10px' }}>{error}</p>}
            {msg && <p style={{ color: '#16a34a', fontSize: 13, margin: '0 0 10px' }}>{msg}</p>}
            <button type="submit" disabled={loading || !toEmail}
              style={{ width: '100%', background: '#ec4899', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading || !toEmail ? 0.6 : 1 }}>
              Enviar invitación
            </button>
          </form>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '12px 0 0' }}>
            Tu pareja debe registrarse con ese mismo email; verá la invitación aquí para aceptarla.
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button onClick={loadInvites} style={{ background: 'none', border: 'none', color: '#be185d', fontSize: 12, cursor: 'pointer', marginRight: 16 }}>↻ Actualizar</button>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}>Salir</button>
        </div>
      </div>
    </div>
  );
}
