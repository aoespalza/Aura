import { Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma';
import { AuthRequest } from '../middleware/auth';

// Solo estas claves se pueden leer/escribir por este endpoint.
const ALLOWED = new Set([
  'profile_age',
  'profile_max_age',
  'intimacy_min_per_encounter',
]);

export class ConfigController {
  // GET /config — config de la pareja como objeto { key: value }
  async get(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const rows = await prisma.coupleConfig.findMany({
        where: { coupleId, key: { in: Array.from(ALLOWED) } },
      });
      const out: Record<string, string> = {};
      for (const r of rows) out[r.key] = r.value;
      res.json(out);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // POST /config  body: { key, value }
  async set(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const { key, value } = req.body;
      if (!ALLOWED.has(key)) {
        res.status(400).json({ error: 'Clave no permitida' });
        return;
      }
      const val = String(value);
      await prisma.coupleConfig.upsert({
        where: { coupleId_key: { coupleId, key } },
        update: { value: val },
        create: { coupleId, key, value: val },
      });
      res.json({ success: true, key, value: val });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
