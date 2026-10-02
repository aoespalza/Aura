import { prisma } from '../database/prisma';

export interface TgConfig { token: string; chatId: string; chatIdHer: string; enabled: boolean; }

const KEY = 'telegram_config';

// Config de Telegram de UNA pareja
export async function getTgConfig(coupleId: string): Promise<TgConfig | null> {
  try {
    const cfg = await prisma.coupleConfig.findUnique({ where: { coupleId_key: { coupleId, key: KEY } } });
    if (cfg?.value) return JSON.parse(cfg.value);
  } catch { /* noop */ }
  return null;
}

export async function saveTgConfig(coupleId: string, cfg: TgConfig): Promise<void> {
  await prisma.coupleConfig.upsert({
    where: { coupleId_key: { coupleId, key: KEY } },
    update: { value: JSON.stringify(cfg) },
    create: { coupleId, key: KEY, value: JSON.stringify(cfg) },
  });
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

export async function sendTelegram(coupleId: string, text: string, onlyHer = false): Promise<{ success: boolean; error?: string }> {
  const config = await getTgConfig(coupleId);
  if (!config?.enabled || !config.token) {
    return { success: false, error: 'Telegram no configurado' };
  }
  const results: boolean[] = [];
  if (!onlyHer && config.chatId)    results.push(await sendToChat(config.token, config.chatId, text));
  if (config.chatIdHer)             results.push(await sendToChat(config.token, config.chatIdHer, text));
  if (results.length === 0) return { success: false, error: 'Sin Chat IDs configurados' };
  return results.some(r => r) ? { success: true } : { success: false, error: 'No se pudo enviar a ningún destinatario' };
}
