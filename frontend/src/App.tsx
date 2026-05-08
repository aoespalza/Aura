import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { CalendarPage } from './pages/CalendarPage';
import { StatsPage } from './pages/StatsPage';
import { DisgutsPage } from './pages/DisgutsPage';
import { CyclePage } from './pages/CyclePage';
import { SettingsPage } from './pages/SettingsPage';
import { HerView } from './pages/HerView';
import { SpecialDatesPage } from './pages/SpecialDatesPage';
import { MatripuntosPage } from './pages/MatripuntosPage';
import './App.css';

type Tab = 'calendar' | 'disgusts' | 'cycle' | 'points' | 'more' | 'settings';

function AppContent() {
  const { isAuth, role, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('calendar');

  if (!isAuth) return <LoginPage />;
  if (role === 'her') return <HerView />;

  return (
    <div style={{ minHeight: '100vh', background: '#fdf2f8', fontFamily: 'system-ui, sans-serif', paddingBottom: 72, width: '100%', overflowX: 'hidden' }}>
      {/* Top bar */}
      <div style={{ background: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fce7f3', position: 'sticky', top: 0, zIndex: 50, width: '100%' }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#be185d' }}>🌸 Aura</span>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}>Salir</button>
      </div>

      {/* Contenido */}
      <div style={{ paddingTop: 12, width: '100%', overflowX: 'hidden' }}>
        {tab === 'calendar' && <CalendarPage />}
        {tab === 'disgusts' && <DisgutsPage />}
        {tab === 'cycle' && <CyclePage />}
        {tab === 'points' && <MatripuntosPage />}
        {tab === 'more' && <SpecialDatesPage />}
        {tab === 'settings' && <SettingsPage />}
      </div>

      {/* Bottom nav — 6 tabs compactos */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #fce7f3', display: 'flex', width: '100%' }}>
        {([['calendar','📅','Hoy'],['disgusts','😤','Disgustos'],['cycle','💜','Ciclo'],['points','💎','Puntos'],['more','✨','Fechas'],['settings','⚙️','Ajustes']] as [Tab,string,string][]).map(([t, icon, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', padding: '8px 0 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: tab === t ? '#ec4899' : '#9ca3af' }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 9, fontWeight: tab === t ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
