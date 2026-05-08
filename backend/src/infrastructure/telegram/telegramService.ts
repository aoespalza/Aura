import { prisma } from '../database/prisma';

interface TgConfig { token: string; chatId: string; chatIdHer: string; enabled: boolean; }

export async function getTgConfig(): Promise<TgConfig | null> {
  try {
    const cfg = await prisma.systemConfig.findFirst({ where: { key: 'telegram_config' } });
    if (cfg?.value) return JSON.parse(cfg.value);
  } catch { /* noop */ }
  return null;
}

async function sendToChat(token: string, chatId: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
    const data = await res.json() as any;
    return data.ok === true;
  } catch { return false; }
}

export async function sendTelegram(text: string, onlyHer = false): Promise<{ success: boolean; error?: string }> {
  const config = await getTgConfig();
  if (!config?.enabled || !config.token) {
    return { success: false, error: 'Telegram no configurado' };
  }
  const results: boolean[] = [];
  if (!onlyHer && config.chatId)    results.push(await sendToChat(config.token, config.chatId, text));
  if (config.chatIdHer)             results.push(await sendToChat(config.token, config.chatIdHer, text));
  if (results.length === 0) return { success: false, error: 'Sin Chat IDs configurados' };
  return results.some(r => r) ? { success: true } : { success: false, error: 'No se pudo enviar a ningún destinatario' };
}
