import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma';

export class SpecialDateController {
  async list(req: Request, res: Response) {
    try {
      const dates = await prisma.specialDate.findMany({ orderBy: [{ month: 'asc' }, { day: 'asc' }] });
      // Calcular días hasta la próxima ocurrencia
      const today = new Date();
      const withNext = dates.map(d => {
        const thisYear = new Date(today.getFullYear(), d.month - 1, d.day);
        const nextYear = new Date(today.getFullYear() + 1, d.month - 1, d.day);
        const next = thisYear >= today ? thisYear : nextYear;
        const daysUntil = Math.ceil((next.getTime() - today.getTime()) / 86400000);
        return { ...d, daysUntil, nextDate: next.toISOString().slice(0, 10) };
      });
      res.json(withNext.sort((a, b) => a.daysUntil - b.daysUntil));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, month, day, type, notes, reminderDays } = req.body;
      const d = await prisma.specialDate.create({
        data: { name, month: parseInt(month), day: parseInt(day), type, notes, reminderDays: reminderDays ?? 3 }
      });
      res.json(d);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }

  async update(req: Request, res: Response) {
    try {
      const { name, month, day, type, notes, reminderDays } = req.body;
      const d = await prisma.specialDate.update({
        where: { id: req.params.id },
        data: { name, month: parseInt(month), day: parseInt(day), type, notes, reminderDays: reminderDays ?? 3 }
      });
      res.json(d);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }

  async remove(req: Request, res: Response) {
    try {
      await prisma.specialDate.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }

  // Fechas próximas en los siguientes N días (para notificaciones)
  async upcoming(req: Request, res: Response) {
    try {
      const days = parseInt(String(req.query.days || '30'));
      const dates = await prisma.specialDate.findMany();
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const upcoming = dates.filter(d => {
        const thisYear = new Date(today.getFullYear(), d.month - 1, d.day);
        const nextYear = new Date(today.getFullYear() + 1, d.month - 1, d.day);
        const next = thisYear >= today ? thisYear : nextYear;
        const daysUntil = Math.ceil((next.getTime() - today.getTime()) / 86400000);
        return daysUntil <= days;
      }).map(d => {
        const thisYear = new Date(today.getFullYear(), d.month - 1, d.day);
        const nextYear = new Date(today.getFullYear() + 1, d.month - 1, d.day);
        const next = thisYear >= today ? thisYear : nextYear;
        return { ...d, daysUntil: Math.ceil((next.getTime() - today.getTime()) / 86400000) };
      }).sort((a, b) => a.daysUntil - b.daysUntil);
      res.json(upcoming);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }
}
