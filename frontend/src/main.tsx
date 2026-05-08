import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Verificar y disparar notificación diaria si corresponde
function checkDailyNotification() {
  try {
    const raw = localStorage.getItem('aura_notif_settings');
    if (!raw) return;
    const { enabled, time } = JSON.parse(raw);
    if (!enabled || Notification.permission !== 'granted') return;

    const nextAlarm = localStorage.getItem('aura_next_alarm');
    const now = new Date();

    // Si ya pasó la hora de la alarma, mostrarla
    if (nextAlarm && new Date(nextAlarm) <= now) {
      new Notification('🌸 Aura', {
        body: '¿Cómo estuvo el día de hoy? Toca para registrarlo.',
        icon: '/icon-192.png',
        tag: 'aura-daily',
      });
      // Programar la próxima para mañana
      const [h, m] = time.split(':').map(Number);
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, h, m, 0);
      localStorage.setItem('aura_next_alarm', next.toISOString());
    }

    // Programar con setTimeout si la alarma es hoy
    if (nextAlarm) {
      const ms = new Date(nextAlarm).getTime() - now.getTime();
      if (ms > 0 && ms < 24 * 60 * 60 * 1000) {
        setTimeout(() => checkDailyNotification(), ms + 1000);
      }
    }
  } catch { /* noop */ }
}

if ('Notification' in window) checkDailyNotification();

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
);
