import { Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma';
import { AuthRequest } from '../middleware/auth';

function parseDay(s?: string | null): Date | null {
  if (!s) return null;
  return new Date(String(s).slice(0, 10) + 'T00:00:00');
}
function daysBetween(start: Date, end: Date | null): number {
  if (!end) return 1;
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
}

export class ActivityController {
  async list(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const activities = await prisma.activity.findMany({ where: { coupleId }, orderBy: { startDate: 'desc' } });
      res.json(activities);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const { title, category, startDate, endDate, proposedBy, paidBy, cost, rating, notes, familySide } = req.body;
      const start = parseDay(startDate);
      if (!title || !start) { res.status(400).json({ error: 'Título y fecha de inicio son obligatorios' }); return; }
      const end = parseDay(endDate);
      const activity = await prisma.activity.create({
        data: {
          coupleId, title: String(title), category: category || null,
          startDate: start, endDate: end, days: daysBetween(start, end),
          proposedBy: proposedBy || null, paidBy: paidBy || null,
          cost: cost != null && cost !== '' ? Number(cost) : null,
          rating: rating != null && rating !== '' ? Number(rating) : null,
          familySide: category === 'familia' ? (familySide || null) : null,
          notes: notes || null,
        },
      });
      res.json(activity);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const existing = await prisma.activity.findFirst({ where: { id: req.params.id, coupleId } });
      if (!existing) { res.status(404).json({ error: 'Actividad no encontrada' }); return; }
      const { title, category, startDate, endDate, proposedBy, paidBy, cost, rating, notes, familySide } = req.body;
      const start = parseDay(startDate) || existing.startDate;
      const end = startDate || endDate !== undefined ? parseDay(endDate) : existing.endDate;
      const newCategory = category ?? existing.category;
      const newFamilySide = familySide !== undefined ? familySide : existing.familySide;
      const activity = await prisma.activity.update({
        where: { id: existing.id },
        data: {
          title: title ?? existing.title, category: newCategory,
          startDate: start, endDate: end, days: daysBetween(start, end),
          proposedBy: proposedBy ?? existing.proposedBy, paidBy: paidBy ?? existing.paidBy,
          cost: cost != null && cost !== '' ? Number(cost) : (cost === '' ? null : existing.cost),
          rating: rating != null && rating !== '' ? Number(rating) : (rating === '' ? null : existing.rating),
          familySide: newCategory === 'familia' ? (newFamilySide || null) : null,
          notes: notes ?? existing.notes,
        },
      });
      res.json(activity);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }

  async remove(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      await prisma.activity.deleteMany({ where: { id: req.params.id, coupleId } });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }
}
