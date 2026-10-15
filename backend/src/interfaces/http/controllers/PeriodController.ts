import { Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma';
import { AuthRequest } from '../middleware/auth';

// Marca como día de período cada día del rango [start, end] en DailyEntry
async function fillPeriodDays(coupleId: string, start: Date, end: Date) {
  const day = new Date(start);
  let n = 1;
  while (day.getTime() <= end.getTime()) {
    const date = new Date(day);
    await prisma.dailyEntry.upsert({
      where: { coupleId_date: { coupleId, date } },
      update: { isPeriodDay: true, periodDayNumber: n },
      create: { coupleId, date, mood: 3, isPeriodDay: true, periodDayNumber: n },
    });
    day.setDate(day.getDate() + 1);
    n++;
  }
}

// Quita la marca de período a los días del rango (sin borrar la entrada)
async function clearPeriodDays(coupleId: string, start: Date, end: Date) {
  await prisma.dailyEntry.updateMany({
    where: { coupleId, date: { gte: start, lte: end }, isPeriodDay: true },
    data: { isPeriodDay: false, periodDayNumber: null },
  });
}

export class PeriodController {
  async list(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const cycles = await prisma.periodCycle.findMany({ where: { coupleId }, orderBy: { startDate: 'desc' } });
      res.json(cycles);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const { startDate, endDate, notes } = req.body;
      const start = new Date(startDate + 'T00:00:00');
      const end = endDate ? new Date(endDate + 'T00:00:00') : null;
      const duration = end ? Math.ceil((end.getTime() - start.getTime()) / 86400000) : null;
      const cycle = await prisma.periodCycle.create({
        data: { coupleId, startDate: start, endDate: end, duration, notes },
      });
      // Rellenar los días del período en el calendario
      await fillPeriodDays(coupleId, start, end || start);
      res.json(cycle);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const { endDate, notes } = req.body;
      const end = endDate ? new Date(endDate + 'T00:00:00') : null;
      const existing = await prisma.periodCycle.findFirst({ where: { id: req.params.id, coupleId } });
      if (!existing) { res.status(404).json({ error: 'Ciclo no encontrado' }); return; }
      const duration = end ? Math.ceil((end.getTime() - existing.startDate.getTime()) / 86400000) : null;
      const cycle = await prisma.periodCycle.update({
        where: { id: existing.id },
        data: { endDate: end, duration, notes },
      });
      // Reajustar los días de período en el calendario
      if (end) {
        await fillPeriodDays(coupleId, existing.startDate, end);
        if (existing.endDate && existing.endDate.getTime() > end.getTime()) {
          const from = new Date(end); from.setDate(from.getDate() + 1);
          await clearPeriodDays(coupleId, from, existing.endDate);
        }
      } else {
        await fillPeriodDays(coupleId, existing.startDate, existing.startDate);
      }
      res.json(cycle);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  async remove(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const existing = await prisma.periodCycle.findFirst({ where: { id: req.params.id, coupleId } });
      if (existing) {
        await clearPeriodDays(coupleId, existing.startDate, existing.endDate || existing.startDate);
        await prisma.periodCycle.delete({ where: { id: existing.id } });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // Calcular próxima fecha estimada basada en promedio de ciclos
  async nextPrediction(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const cycles = await prisma.periodCycle.findMany({
        where: { coupleId, endDate: { not: null } },
        orderBy: { startDate: 'desc' },
        take: 6,
      });
      if (cycles.length < 2) { res.json({ prediction: null }); return; }

      const intervals: number[] = [];
      for (let i = 0; i < cycles.length - 1; i++) {
        const diff = Math.ceil(
          (cycles[i].startDate.getTime() - cycles[i + 1].startDate.getTime()) / 86400000
        );
        intervals.push(diff);
      }
      const avgCycle = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
      const lastStart = cycles[0].startDate;
      const nextDate = new Date(lastStart.getTime() + avgCycle * 86400000);

      res.json({ prediction: nextDate.toISOString().split('T')[0], avgCycleDays: avgCycle });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
