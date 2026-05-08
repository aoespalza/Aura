import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../infrastructure/database/prisma';

async function getPinHash(key: 'pin_him' | 'pin_her'): Promise<string> {
  const cfg = await prisma.systemConfig.findFirst({ where: { key } });
  if (cfg) return cfg.value;
  const hash = await bcrypt.hash(key === 'pin_him' ? '1234' : '5678', 10);
  await prisma.systemConfig.upsert({
    where: { key }, update: { value: hash }, create: { key, value: hash }
  });
  return hash;
}

async function setPinHash(key: 'pin_him' | 'pin_her', hash: string) {
  await prisma.systemConfig.upsert({
    where: { key }, update: { value: hash }, create: { key, value: hash }
  });
}

export class AuthController {
  async login(req: Request, res: Response) {
    const { pin } = req.body;
    if (!pin) { res.status(400).json({ error: 'PIN requerido' }); return; }

    const [hisHash, herHash] = await Promise.all([getPinHash('pin_him'), getPinHash('pin_her')]);
    const isHis = await bcrypt.compare(String(pin), hisHash);
    const isHer = !isHis && await bcrypt.compare(String(pin), herHash);

    if (!isHis && !isHer) { res.status(401).json({ error: 'PIN incorrecto' }); return; }

    const role = isHis ? 'him' : 'her';
    const token = jwt.sign(
      { id: 'aura-user', role },
      process.env.JWT_SECRET || 'aura-secret',
      { expiresIn: '30d' }
    );
    res.json({ token, role });
  }

  async changePin(req: Request, res: Response) {
    const { currentPin, newPin, target } = req.body;
    const role = (req as any).userRole;
    if (role !== 'him') { res.status(403).json({ error: 'Solo el administrador puede cambiar PINs' }); return; }

    const hisHash = await getPinHash('pin_him');
    const isHis = await bcrypt.compare(String(currentPin), hisHash);
    if (!isHis) { res.status(401).json({ error: 'PIN actual incorrecto' }); return; }

    const newHash = await bcrypt.hash(String(newPin), 10);
    await setPinHash(target === 'her' ? 'pin_her' : 'pin_him', newHash);
    res.json({ success: true });
  }
}
