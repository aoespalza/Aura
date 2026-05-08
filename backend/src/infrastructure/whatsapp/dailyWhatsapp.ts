import { prisma } from '../database/prisma';
import { sendWhatsApp } from './whatsappService';

export async function sendDailyWhatsapp() {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    // 1. Recordatorio: ¿registraste ayer?
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEntry = await prisma.dailyEntry.findFirst({ where: { date: yesterday } });

    // 2. Fechas especiales próximas (hoy o mañana)
    const specialDates = await prisma.specialDate.findMany();
    const todaySpecial = specialDates.filter(d => {
      const next = new Date(today.getFullYear(), d.month - 1, d.day);
      const daysUntil = Math.ceil((next.getTime() - today.getTime()) / 86400000);
      return daysUntil >= 0 && daysUntil <= d.reminderDays;
    });

    // 3. Período próximo
    const cycles = await prisma.periodCycle.findMany({ orderBy: { startDate: 'desc' }, take: 3 });
    let periodAlert = '';
    if (cycles.length >= 2) {
      const intervals = [];
      for (let i = 0; i < cycles.length - 1; i++) {
        intervals.push(Math.ceil((cycles[i].startDate.getTime() - cycles[i + 1].startDate.getTime()) / 86400000));
      }
      const avgCycle = Math.round(intervals.reduce((a, b) => a + b) / intervals.length);
      const nextPeriod = new Date(cycles[0].startDate.getTime() + avgCycle * 86400000);
      const daysUntil = Math.ceil((nextPeriod.getTime() - today.getTime()) / 86400000);
      if (daysUntil >= 0 && daysUntil <= 3) {
        periodAlert = daysUntil === 0
          ? '💜 El período de ella empieza hoy — sé paciente y atento.'
          : `💜 Período en ${daysUntil} día(s) — ten paciencia extra.`;
      }
    }

    // Construir mensaje
    const lines: string[] = ['🌸 *Aura — Resumen del día*'];

    if (!yesterdayEntry) {
      lines.push('📝 No registraste cómo estuvo *ayer* — aún puedes hacerlo.');
    }

    todaySpecial.forEach(d => {
      const daysUntil = Math.ceil((new Date(today.getFullYear(), d.month - 1, d.day).getTime() - today.getTime()) / 86400000);
      lines.push(daysUntil === 0
        ? `🎉 ¡Hoy es *${d.name}*! ${d.notes || ''}`
        : `📅 *${d.name}* en ${daysUntil} día(s). ${d.notes || ''}`);
    });

    if (periodAlert) lines.push(periodAlert);

    if (lines.length === 1) {
      lines.push('✅ Todo al día — sigue así.');
    }

    lines.push(`\n_${new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}_`);

    await sendWhatsApp(lines.join('\n'));
    console.log('[Aura WhatsApp] Resumen diario enviado');
  } catch (e) {
    console.error('[Aura WhatsApp] Error:', e);
  }
}
