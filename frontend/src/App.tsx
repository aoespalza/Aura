import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { CalendarPage } from './pages/CalendarPage';
import { StatsPage } from './pages/StatsPage';
import { DisgutsPage } from './pages/DisgutsPage';
import { CyclePage } from './pages/CyclePage';
import { SettingsPage } from './pages/SettingsPage';
import './App.css';

type Tab = 'calendar' | 'disgusts' | 'cycle' | 'stats' | 'settings';

function AppContent() {
  const { isAuth, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('calendar');

  if (!isAuth) return <LoginPage />;

  return (
    <div style={{ minHeight: '100vh', background: '#fdf2f8', fontFamily: 'system-ui, sans-serif', paddingBottom: 80 }}>
      {/* Top bar */}
      <div style={{ background: 'white', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fce7f3', position: 'sticky', top: 0, zIndex: 50 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#be185d' }}>🌸 Aura</span>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}>Salir</button>
      </div>

      {/* Contenido */}
      <div style={{ paddingTop: 16 }}>
        {tab === 'calendar' && <CalendarPage />}
        {tab === 'disgusts' && <DisgutsPage />}
        {tab === 'cycle' && <CyclePage />}
        {tab === 'stats' && <StatsPage />}
        {tab === 'settings' && <SettingsPage />}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #fce7f3', display: 'flex', justifyContent: 'center', gap: 0 }}>
        {([['calendar','📅','Hoy'],['disgusts','😤','Disgustos'],['cycle','💜','Ciclo'],['stats','📊','Resumen'],['settings','⚙️','Ajustes']] as [Tab,string,string][]).map(([t, icon, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: tab === t ? '#ec4899' : '#9ca3af' }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === t ? 700 : 400 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
