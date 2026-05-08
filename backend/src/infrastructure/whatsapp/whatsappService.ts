import { prisma } from '../database/prisma';

interface WaConfig { phone: string; apiKey: string; enabled: boolean; }

async function getConfig(): Promise<WaConfig | null> {
  try {
    const cfg = await prisma.systemConfig?.findFirst({ where: { key: 'whatsapp_config' } }).catch(() => null);
    if (cfg?.value) return JSON.parse(cfg.value as string);
  } catch { /* noop */ }
  return null;
}

export async function sendWhatsApp(text: string): Promise<{ success: boolean; error?: string }> {
  const config = await getConfig();
  if (!config?.enabled || !config.phone || !config.apiKey) {
    return { success: false, error: 'WhatsApp no configurado' };
  }
  try {
    const phone = config.phone.replace(/\D/g, '');
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${config.apiKey}`;
    const res = await fetch(url);
    const body = await res.text();
    if (body.toLowerCase().includes('message queued') || body.toLowerCase().includes('ok')) {
      return { success: true };
    }
    return { success: false, error: body.slice(0, 100) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
