import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma';

const LEVELS = [
  { min: 0,    label: '🌱 Semilla',       color: '#86efac' },
  { min: 100,  label: '🌸 Floreciendo',   color: '#f9a8d4' },
  { min: 300,  label: '💑 Cómplices',     color: '#fb923c' },
  { min: 600,  label: '❤️ Enamorados',    color: '#ef4444' },
  { min: 1000, label: '💍 Almas Gemelas', color: '#ec4899' },
];

function calcPoints(entries: any[]): number {
  let pts = 0;
  let streak = 0;
  let lastDate = '';

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  for (const e of sorted) {
    const dateStr = e.date.slice(0, 10);

    // Streak consecutivo
    if (lastDate) {
      const prev = new Date(lastDate); prev.setDate(prev.getDate() + 1);
      if (prev.toISOString().slice(0, 10) === dateStr) streak++;
      else streak = 1;
    } else { streak = 1; }
    lastDate = dateStr;

    pts += 2;                                              // por registrar
    if (e.mood >= 4) pts += 2;                            // buen día
    if (e.hasIntimacy) pts += 5;                          // intimidad
    if (e.hasDetail) pts += 10;                           // detalle
    if (e.hasDisgust && e.disgustResolved) pts += 4;      // resolver conflicto
    if (e.hasDisgust && !e.disgustResolved && (e.disgustIntensity || 0) >= 4) pts -= 3; // conflicto grave sin resolver
    if (streak >= 7) pts += 3;                            // racha semanal
    else if (streak >= 3) pts += 1;                       // racha 3 días
  }

  return Math.max(0, pts);
}

export class PointsController {
  async get(req: Request, res: Response) {
    try {
      const months = parseInt(String(req.query.months || '3'));
      const since = new Date(); since.setMonth(since.getMonth() - months);

      const entries = await prisma.dailyEntry.findMany({
        where: { date: { gte: since } },
        orderBy: { date: 'asc' }
      });

      const allEntries = await prisma.dailyEntry.findMany({ orderBy: { date: 'asc' } });

      const totalPoints = calcPoints(allEntries);
      const periodPoints = calcPoints(entries);

      const level = [...LEVELS].reverse().find(l => totalPoints >= l.min) || LEVELS[0];
      const nextLevel = LEVELS.find(l => l.min > totalPoints);
      const progressToNext = nextLevel
        ? Math.round(((totalPoints - (level.min)) / (nextLevel.min - level.min)) * 100)
        : 100;

      // Desglose del período
      const breakdown = {
        days: entries.length,
        intimacyBonus: entries.filter(e => e.hasIntimacy).length * 5,
        detailBonus: entries.filter(e => e.hasDetail).length * 10,
        moodBonus: entries.filter(e => e.mood >= 4).length * 2,
        resolvedBonus: entries.filter(e => e.hasDisgust && e.disgustResolved).length * 4,
      };

      // Historial mensual (últimos 6 meses)
      const monthly: { month: string; points: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthEntries = allEntries.filter(e => e.date.toISOString().slice(0, 7) === key);
        monthly.push({ month: key, points: calcPoints(monthEntries) });
      }

      res.json({ totalPoints, periodPoints, level, nextLevel, progressToNext, breakdown, monthly });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }
}
