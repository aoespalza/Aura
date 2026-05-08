// Service Worker personalizado de Aura — gestiona recordatorios diarios

const ALARM_KEY = 'aura_alarm_time';

// Recibir configuración de la app
self.addEventListener('message', event => {
  if (event.data?.type === 'SCHEDULE_DAILY') {
    const time = event.data.time || '21:00';
    self.registration.storage?.setItem(ALARM_KEY, time).catch(() => {});
    scheduleNext(time);
  }
});

let alarmTimer = null;

function scheduleNext(time) {
  if (alarmTimer) clearTimeout(alarmTimer);
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  if (next <= now) next.setDate(next.getDate() + 1); // mañana si ya pasó
  const ms = next.getTime() - now.getTime();
  alarmTimer = setTimeout(() => {
    fireNotification();
    scheduleNext(time); // reprogramar para mañana
  }, ms);
}

function fireNotification() {
  self.registration.showNotification('🌸 Aura', {
    body: '¿Cómo estuvo el día de hoy? Toca para registrarlo.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'aura-daily',
    renotify: true,
    actions: [{ action: 'open', title: 'Registrar ahora' }],
  });
}

// Abrir la app al tocar la notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});

// Al activarse el SW, restaurar el alarm si había uno
self.addEventListener('activate', event => {
  event.waitUntil(
    self.registration.storage?.getItem(ALARM_KEY).then(time => {
      if (time) scheduleNext(time);
    }).catch(() => {})
  );
});
