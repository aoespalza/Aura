import { prisma } from '../database/prisma';

interface TgConfig { token: string; chatId: string; enabled: boolean; }

export async function getTgConfig(): Promise<TgConfig | null> {
  try {
    const cfg = await prisma.systemConfig.findFirst({ where: { key: 'telegram_config' } });
    if (cfg?.value) return JSON.parse(cfg.value);
  } catch { /* noop */ }
  return null;
}

export async function sendTelegram(text: string): Promise<{ success: boolean; error?: string }> {
  const config = await getTgConfig();
  if (!config?.enabled || !config.token || !config.chatId) {
    return { success: false, error: 'Telegram no configurado' };
  }
  try {
    const url = `https://api.telegram.org/bot${config.token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: config.chatId, text, parse_mode: 'Markdown' }),
    });
    const data = await res.json() as any;
    if (data.ok) return { success: true };
    return { success: false, error: data.description || 'Error Telegram API' };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
