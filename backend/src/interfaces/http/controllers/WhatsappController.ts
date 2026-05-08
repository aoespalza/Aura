import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma';
import { sendWhatsApp } from '../../../infrastructure/whatsapp/whatsappService';

export class WhatsappController {
  async getConfig(req: Request, res: Response) {
    try {
      const cfg = await prisma.systemConfig.findFirst({ where: { key: 'whatsapp_config' } });
      if (cfg) {
        const parsed = JSON.parse(cfg.value);
        res.json({ ...parsed, apiKey: parsed.apiKey ? '***' : '' }); // ocultar key
      } else {
        res.json({ phone: '', apiKey: '', enabled: false });
      }
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }

  async saveConfig(req: Request, res: Response) {
    try {
      const { phone, apiKey, enabled } = req.body;
      // Si apiKey viene como '***', mantener el existente
      let finalKey = apiKey;
      if (apiKey === '***') {
        const existing = await prisma.systemConfig.findFirst({ where: { key: 'whatsapp_config' } });
        if (existing) finalKey = JSON.parse(existing.value).apiKey;
      }
      await prisma.systemConfig.upsert({
        where: { key: 'whatsapp_config' },
        update: { value: JSON.stringify({ phone, apiKey: finalKey, enabled }) },
        create: { key: 'whatsapp_config', value: JSON.stringify({ phone, apiKey: finalKey, enabled }) },
      });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }

  async sendTest(req: Request, res: Response) {
    try {
      const result = await sendWhatsApp('🌸 *Aura* — Prueba de notificación WhatsApp ✅\n¡Todo configurado correctamente!');
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  }
}
