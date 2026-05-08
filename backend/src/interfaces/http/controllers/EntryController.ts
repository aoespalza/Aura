import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma';

export class EntryController {
  // GET /entries?month=2026-05
  async list(req: Request, res: Response) {
    try {
      const { month } = req.query;
      let where = {};
      if (month) {
        const [year, m] = String(month).split('-').map(Number);
        const start = new Date(year, m - 1, 1);
        const end = new Date(year, m, 0, 23, 59, 59);
        where = { date: { gte: start, lte: end } };
      }
      const entries = await prisma.dailyEntry.findMany({ where, orderBy: { date: 'asc' } });
      res.json(entries);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // GET /entries/:date  (formato YYYY-MM-DD)
  async getByDate(req: Request, res: Response) {
    try {
      const date = new Date(req.params.date + 'T00:00:00');
      const entry = await prisma.dailyEntry.findFirst({ where: { date } });
      res.json(entry || null);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // POST /entries  — crea o actualiza (upsert por fecha)
  async upsert(req: Request, res: Response) {
    try {
      const { date, ...data } = req.body;
      const parsedDate = new Date(date + 'T00:00:00');
      const entry = await prisma.dailyEntry.upsert({
        where: { date: parsedDate },
        update: data,
        create: { date: parsedDate, mood: data.mood ?? 3, ...data },
      });
      res.json(entry);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // DELETE /entries/:date
  async remove(req: Request, res: Response) {
    try {
      const date = new Date(req.params.date + 'T00:00:00');
      await prisma.dailyEntry.deleteMany({ where: { date } });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // GET /entries/stats?months=3
  async stats(req: Request, res: Response) {
    try {
      const months = parseInt(String(req.query.months || '3'));
      const since = new Date();
      since.setMonth(since.getMonth() - months);

      const entries = await prisma.dailyEntry.findMany({
        where: { date: { gte: since } },
        orderBy: { date: 'asc' },
      });

      const total = entries.length;
      const avgMood = total ? entries.reduce((s, e) => s + e.mood, 0) / total : 0;
      const intimacyDays = entries.filter(e => e.hasIntimacy).length;
      const disgustDays = entries.filter(e => e.hasDisgust).length;
      const periodDays = entries.filter(e => e.isPeriodDay).length;
      const detailDays = entries.filter(e => e.hasDetail).length;

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
