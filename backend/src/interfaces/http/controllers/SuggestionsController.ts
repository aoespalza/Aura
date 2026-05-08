import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma';

const DETAIL_SUGGESTIONS: Record<string, string[]> = {
  regalo:   ['Un libro de su autor favorito', 'Flores sorpresa', 'Su postre favorito', 'Un accesorio que mencionó'],
  salida:   ['Cena en ese restaurante que quiere conocer', 'Película en casa con palomitas', 'Paseo en la tarde', 'Plan sorpresa el fin de semana'],
  palabras: ['Una nota dejada en su bolso', 'Un mensaje de voz recordándole cuánto la amas', 'Decirle algo específico que admiras de ella'],
  ayuda:    ['Organizar algo de la casa sin que pida', 'Encargarte de la cena esta noche', 'Resolver ese pendiente que tiene hace días'],
  sorpresa: ['Pedirle el día libre y planear algo especial', 'Traer algo que le guste sin razón aparente'],
};

export class SuggestionsController {
  async get(req: Request, res: Response) {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const thirtyAgo = new Date(today); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
      const sevenAgo = new Date(today); sevenAgo.setDate(sevenAgo.getDate() - 7);

      const [recentEntries, allEntries, cycles, specialDates] = await Promise.all([
        prisma.dailyEntry.findMany({ where: { date: { gte: sevenAgo } }, orderBy: { date: 'desc' } }),
        prisma.dailyEntry.findMany({ where: { date: { gte: thirtyAgo } }, orderBy: { date: 'desc' } }),
        prisma.periodCycle.findMany({ orderBy: { startDate: 'desc' }, take: 3 }),
        prisma.specialDate.findMany(),
      ]);

      const suggestions: { type: string; priority: 'high' | 'medium' | 'low'; title: string; description: string; action?: string }[] = [];

      // 1. Días sin detalles
      const lastDetail = allEntries.find(e => e.hasDetail);
      const daysSinceDetail = lastDetail
        ? Math.ceil((today.getTime() - new Date(lastDetail.date).getTime()) / 86400000)
        : 30;
      if (daysSinceDetail >= 7) {
        const type = daysSinceDetail >= 14 ? 'high' : 'medium';
        const detailTypes = Object.keys(DETAIL_SUGGESTIONS);
        const randomType = detailTypes[Math.floor(Math.random() * detailTypes.length)];
        const options = DETAIL_SUGGESTIONS[randomType];
        suggestions.push({
          type: 'detail',
          priority: type,
          title: daysSinceDetail >= 14 ? '💝 Llevas 2 semanas sin un detalle' : '🎁 Ya van 7 días sin detalles',
          description: options[Math.floor(Math.random() * options.length)],
          action: randomType,
        });
      }

      // 2. Mood bajo reciente
      if (recentEntries.length >= 3) {
        const avgMood = recentEntries.slice(0, 3).reduce((s, e) => s + e.mood, 0) / 3;
        if (avgMood < 3) {
          suggestions.push({
            type: 'mood',
            priority: 'high',
            title: '😔 Lleva días de bajo ánimo',
            description: DETAIL_SUGGESTIONS.palabras[Math.floor(Math.random() * DETAIL_SUGGESTIONS.palabras.length)],
            action: 'palabras',
          });
        }
      }

      // 3. Período próximo (predicción)
      if (cycles.length >= 2) {
        const intervals = [];
        for (let i = 0; i < cycles.length - 1; i++) {
          intervals.push(Math.ceil((cycles[i].startDate.getTime() - cycles[i + 1].startDate.getTime()) / 86400000));
        }
        const avgCycle = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
        const nextPeriod = new Date(cycles[0].startDate.getTime() + avgCycle * 86400000);
        const daysUntilPeriod = Math.ceil((nextPeriod.getTime() - today.getTime()) / 86400000);
        if (daysUntilPeriod >= 0 && daysUntilPeriod <= 5) {
          suggestions.push({
            type: 'period',
            priority: daysUntilPeriod <= 2 ? 'high' : 'medium',
            title: daysUntilPeriod === 0 ? '💜 El período empieza hoy' : `💜 Período en ${daysUntilPeriod} día(s)`,
            description: 'Ten más paciencia estos días y ten a mano lo que necesita.',
            action: 'ayuda',
          });
        }
      }

      // 4. Fechas especiales próximas
      specialDates.forEach(d => {
        const thisYear = new Date(today.getFullYear(), d.month - 1, d.day);
        const next = thisYear >= today ? thisYear : new Date(today.getFullYear() + 1, d.month - 1, d.day);
        const daysUntil = Math.ceil((next.getTime() - today.getTime()) / 86400000);
        if (daysUntil <= d.reminderDays) {
          suggestions.push({
            type: 'special',
            priority: daysUntil <= 1 ? 'high' : 'medium',
            title: daysUntil === 0 ? `🎉 ¡Hoy es ${d.name}!` : `📅 ${d.name} en ${daysUntil} día(s)`,
            description: d.notes || 'No olvides hacer de este día algo especial.',
          });
        }
      });

      // 5. Racha de días bien — reforzar
      const streak = recentEntries.filter(e => e.mood >= 4).length;
      if (streak >= 5) {
        suggestions.push({
          type: 'streak',
          priority: 'low',
          title: `🔥 ${streak} días con buen ánimo seguidos`,
          description: 'Están en una buena racha — aprovecha para hacer algo memorable.',
        });
      }

      res.json(suggestions.slice(0, 4)); // máximo 4 sugerencias
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }
}
