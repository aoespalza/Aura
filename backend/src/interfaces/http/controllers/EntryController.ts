import { Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma';
import { AuthRequest } from '../middleware/auth';

export class EntryController {
  // GET /entries?month=2026-05
  async list(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const { month } = req.query;
      let where: any = { coupleId };
      if (month) {
        const [year, m] = String(month).split('-').map(Number);
        const start = new Date(year, m - 1, 1);
        const end = new Date(year, m, 0, 23, 59, 59);
        where = { coupleId, date: { gte: start, lte: end } };
      }
      const entries = await prisma.dailyEntry.findMany({ where, orderBy: { date: 'asc' } });
      res.json(entries);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // GET /entries/:date  (formato YYYY-MM-DD)
  async getByDate(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const date = new Date(req.params.date + 'T00:00:00');
      const entry = await prisma.dailyEntry.findFirst({ where: { coupleId, date } });
      res.json(entry || null);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // POST /entries  — crea o actualiza (upsert por fecha dentro de la pareja)
  async upsert(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const { date, id, createdAt, updatedAt, coupleId: _ignore, ...data } = req.body;
      const parsedDate = new Date(date.slice(0, 10) + 'T00:00:00');
      const entry = await prisma.dailyEntry.upsert({
        where: { coupleId_date: { coupleId, date: parsedDate } },
        update: data,
        create: { coupleId, date: parsedDate, mood: data.mood ?? 3, ...data },
      });
      res.json(entry);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // DELETE /entries/:date
  async remove(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const date = new Date(req.params.date + 'T00:00:00');
      await prisma.dailyEntry.deleteMany({ where: { coupleId, date } });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // GET /entries/stats?months=3
  async stats(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const months = parseInt(String(req.query.months || '3'));
      const since = new Date();
      since.setMonth(since.getMonth() - months);

      const entries = await prisma.dailyEntry.findMany({
        where: { coupleId, date: { gte: since } },
        orderBy: { date: 'asc' },
      });

      // Actividades (tiempo juntos) en el rango
      const activities = await prisma.activity.findMany({
        where: { coupleId, startDate: { gte: since } },
      });
      const activitiesCount = activities.length;
      const daysTogether = activities.reduce((s, a) => s + (a.days || 1), 0);
      const catCount: Record<string, number> = {};
      activities.forEach(a => { if (a.category) catCount[a.category] = (catCount[a.category] || 0) + 1; });
      const topCategory = Object.entries(catCount).sort((x, y) => y[1] - x[1])[0]?.[0] || null;
      const ratings = activities.filter(a => typeof a.rating === 'number').map(a => a.rating as number);
      const avgActivityRating = ratings.length ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10 : 0;

      const round1 = (n: number) => Math.round(n * 10) / 10;
      const avgOf = (arr: (number | null | undefined)[]) => {
        const vals = arr.filter((v): v is number => typeof v === 'number');
        return vals.length ? round1(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
      };

      const total = entries.length;
      const avgMood = total ? entries.reduce((s, e) => s + e.mood, 0) / total : 0;
      const intimacyDays = entries.filter(e => e.hasIntimacy).length;
      const disgustDays = entries.filter(e => e.hasDisgust).length;
      const periodDays = entries.filter(e => e.isPeriodDay).length;
      const detailDays = entries.filter(e => e.hasDetail).length;

      // Promedios de calidad / intensidad (escala 1-5)
      const avgIntimacyQuality = avgOf(entries.filter(e => e.hasIntimacy).map(e => e.intimacyQuality));
      const avgDisgustIntensity = avgOf(entries.filter(e => e.hasDisgust).map(e => e.disgustIntensity));

      // % de disgustos resueltos
      const disgustResolvedDays = entries.filter(e => e.hasDisgust && e.disgustResolved).length;
      const disgustResolvedRate = disgustDays > 0 ? Math.round((disgustResolvedDays / disgustDays) * 100) : 0;

      // Frecuencia promedio por mes (sobre el rango consultado)
      const perMonth = (n: number) => (months > 0 ? round1(n / months) : 0);
      const intimacyPerMonth = perMonth(intimacyDays);
      const disgustPerMonth = perMonth(disgustDays);
      const detailPerMonth = perMonth(detailDays);

      // Correlación período-disgusto: días de período que también tienen disgusto
      const periodWithDisgust = entries.filter(e => e.isPeriodDay && e.hasDisgust).length;
      const periodDisgustRate = periodDays > 0 ? Math.round((periodWithDisgust / periodDays) * 100) : 0;

      // Mood promedio por día de la semana
      const moodByWeekday: Record<number, { total: number; count: number }> = {};
      entries.forEach(entry => {
        const wd = new Date(entry.date).getDay();
        if (!moodByWeekday[wd]) moodByWeekday[wd] = { total: 0, count: 0 };
        moodByWeekday[wd].total += entry.mood;
        moodByWeekday[wd].count++;
      });

      res.json({
        total,
        avgMood: Math.round(avgMood * 10) / 10,
        intimacyDays,
        disgustDays,
        periodDays,
        detailDays,
        avgIntimacyQuality,
        avgDisgustIntensity,
        disgustResolvedRate,
        intimacyPerMonth,
        disgustPerMonth,
        detailPerMonth,
        activitiesCount,
        daysTogether,
        topCategory,
        avgActivityRating,
        periodDisgustRate,
        moodByWeekday: Object.fromEntries(
          Object.entries(moodByWeekday).map(([k, v]) => [k, Math.round((v.total / v.count) * 10) / 10])
        ),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
