import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma';
import { sendTelegram } from '../../../infrastructure/telegram/telegramService';

export class TelegramController {
  async getConfig(req: Request, res: Response) {
    try {
      const cfg = await prisma.systemConfig.findFirst({ where: { key: 'telegram_config' } });
      if (cfg) {
        const parsed = JSON.parse(cfg.value);
        res.json({ ...parsed, token: parsed.token ? '***' : '' });
      } else {
        res.json({ token: '', chatId: '', chatIdHer: '', enabled: false });
      }
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }

  async saveConfig(req: Request, res: Response) {
    try {
      const { token, chatId, chatIdHer, enabled } = req.body;
      let finalToken = token;
      if (token === '***') {
        const existing = await prisma.systemConfig.findFirst({ where: { key: 'telegram_config' } });
        if (existing) finalToken = JSON.parse(existing.value).token;
      }
      await prisma.systemConfig.upsert({
        where: { key: 'telegram_config' },
        update: { value: JSON.stringify({ token: finalToken, chatId, chatIdHer, enabled }) },
        create: { key: 'telegram_config', value: JSON.stringify({ token: finalToken, chatId, chatIdHer, enabled }) },
      });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }

  async sendTest(req: Request, res: Response) {
    try {
      const result = await sendTelegram('🌸 *Aura* — Prueba de notificación ✅\n¡Telegram configurado correctamente!');
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }
}
