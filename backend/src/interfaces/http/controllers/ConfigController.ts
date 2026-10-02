import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma';

// Solo estas claves se pueden leer/escribir por este endpoint.
// (Los PIN viven también en SystemConfig pero NO se exponen aquí.)
const ALLOWED = new Set([
  'profile_age',
  'profile_max_age',
  'intimacy_min_per_encounter',
]);

export class ConfigController {
  // GET /config — devuelve las claves permitidas como objeto { key: value }
  async get(_req: Request, res: Response) {
    try {
      const rows = await prisma.systemConfig.findMany({
        where: { key: { in: Array.from(ALLOWED) } },
      });
      const out: Record<string, string> = {};
      for (const r of rows) out[r.key] = r.value;
      res.json(out);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // POST /config  body: { key, value }
  async set(req: Request, res: Response) {
    try {
      const { key, value } = req.body;
      if (!ALLOWED.has(key)) {
        res.status(400).json({ error: 'Clave no permitida' });
        return;
      }
      const val = String(value);
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: val },
        create: { key, value: val },
      });
      res.json({ success: true, key, value: val });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
