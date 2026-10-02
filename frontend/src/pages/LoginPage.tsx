import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, name || undefined);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo completar. Revisa los datos.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 15, border: '2px solid #fce7f3',
    borderRadius: 12, outline: 'none', marginBottom: 12, boxSizing: 'border-box', color: '#be185d',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '40px 32px', boxShadow: '0 20px 60px rgba(236,72,153,0.15)', textAlign: 'center', width: '100%', maxWidth: 340 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🌸</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#be185d', margin: '0 0 4px' }}>Aura</h1>
        <p style={{ color: '#9ca3af', marginBottom: 28, fontSize: 14 }}>
          {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input type="text" placeholder="Tu nombre (opcional)" value={name}
              onChange={e => setName(e.target.value)} style={inputStyle} autoComplete="name" />
          )}
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} style={inputStyle} autoComplete="email" required />
          <input type="password" placeholder="Contraseña" value={password}
            onChange={e => setPassword(e.target.value)} style={inputStyle}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />

          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={loading || !email || !password}
            style={{ width: '100%', background: '#ec4899', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: loading || !email || !password ? 0.6 : 1 }}>
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          style={{ marginTop: 20, background: 'none', border: 'none', color: '#be185d', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
}
