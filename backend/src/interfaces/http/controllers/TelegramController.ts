import { Response } from 'express';
import { getTgConfig, saveTgConfig, sendTelegram } from '../../../infrastructure/telegram/telegramService';
import { AuthRequest } from '../middleware/auth';

export class TelegramController {
  async getConfig(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const cfg = await getTgConfig(coupleId);
      if (cfg) {
        res.json({ ...cfg, token: cfg.token ? '***' : '' });
      } else {
        res.json({ token: '', chatId: '', chatIdHer: '', enabled: false });
      }
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }

  async saveConfig(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const { token, chatId, chatIdHer, enabled } = req.body;
      let finalToken = token;
      if (token === '***') {
        const existing = await getTgConfig(coupleId);
        if (existing) finalToken = existing.token;
      }
      await saveTgConfig(coupleId, { token: finalToken, chatId, chatIdHer, enabled: !!enabled });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }

  async sendTest(req: AuthRequest, res: Response) {
    try {
      const coupleId = req.coupleId!;
      const result = await sendTelegram(coupleId, '🌸 *Aura* — Prueba de notificación ✅\n¡Telegram configurado correctamente!');
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }
}
