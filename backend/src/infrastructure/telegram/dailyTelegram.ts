import { prisma } from '../database/prisma';
import { sendTelegram } from './telegramService';

export async function sendDailyTelegram() {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

    // ¿Registraste ayer?
    const yesterdayEntry = await prisma.dailyEntry.findFirst({ where: { date: yesterday } });

    // Fechas especiales próximas
    const specialDates = await prisma.specialDate.findMany();
    const upcoming = specialDates.filter(d => {
      const next = new Date(today.getFullYear(), d.month - 1, d.day);
      if (next < today) next.setFullYear(next.getFullYear() + 1);
      const daysUntil = Math.ceil((next.getTime() - today.getTime()) / 86400000);
      return daysUntil <= d.reminderDays;
    }).map(d => {
      const next = new Date(today.getFullYear(), d.month - 1, d.day);
      if (next < today) next.setFullYear(next.getFullYear() + 1);
      return { ...d, daysUntil: Math.ceil((next.getTime() - today.getTime()) / 86400000) };
    });

    // Período próximo
    let periodAlert = '';
    const cycles = await prisma.periodCycle.findMany({ orderBy: { startDate: 'desc' }, take: 3 });
    if (cycles.length >= 2) {
      const intervals = [];
      for (let i = 0; i < cycles.length - 1; i++) {
        intervals.push(Math.ceil((cycles[i].startDate.getTime() - cycles[i+1].startDate.getTime()) / 86400000));
      }
      const avg = Math.round(intervals.reduce((a, b) => a + b) / intervals.length);
      const next = new Date(cycles[0].startDate.getTime() + avg * 86400000);
      const days = Math.ceil((next.getTime() - today.getTime()) / 86400000);
      if (days >= 0 && days <= 3) {
        periodAlert = days === 0 ? '💜 El período empieza *hoy* — paciencia y atención extra.' : `💜 Período en *${days} día(s)* — prepárate.`;
      }
    }

    const lines = ['🌸 *Aura — Buenos días*'];
    if (!yesterdayEntry) lines.push('📝 No registraste cómo estuvo *ayer* — puedes hacerlo ahora.');
    upcoming.forEach(d => {
      lines.push(d.daysUntil === 0
        ? `🎉 ¡Hoy es *${d.name}*! ${d.notes || ''}`
        : `📅 *${d.name}* en ${d.daysUntil} día(s)${d.notes ? ` — ${d.notes}` : ''}`);
    });
    if (periodAlert) lines.push(periodAlert);
    if (lines.length === 1) lines.push('✅ Todo al día — sigue siendo un buen compañero.');

    const dateLabel = today.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    lines.push(`\n_${dateLabel}_`);

    await sendTelegram(lines.join('\n'));
    console.log('[Aura Telegram] Resumen diario enviado');
  } catch (e) {
    console.error('[Aura Telegram] Error:', e);
  }
}
