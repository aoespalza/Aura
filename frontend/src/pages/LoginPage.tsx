import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(pin); }
    catch { setError('PIN incorrecto'); setPin(''); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', boxShadow: '0 20px 60px rgba(236,72,153,0.15)', textAlign: 'center', width: 320 }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🌸</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#be185d', margin: '0 0 4px' }}>Aura</h1>
        <p style={{ color: '#9ca3af', marginBottom: 32, fontSize: 14 }}>Tu diario de bienestar</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            value={pin}
            onChange={e => setPin(e.target.value)}
            maxLength={8}
            style={{ width: '100%', padding: '14px', fontSize: 24, textAlign: 'center', letterSpacing: 8, border: '2px solid #fce7f3', borderRadius: 12, outline: 'none', marginBottom: 16, boxSizing: 'border-box', color: '#be185d' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={loading || !pin}
            style={{ width: '100%', background: '#ec4899', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: loading || !pin ? 0.6 : 1 }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p style={{ color: '#d1d5db', fontSize: 11, marginTop: 24 }}>PIN por defecto: 1234</p>
      </div>
    </div>
  );
}
