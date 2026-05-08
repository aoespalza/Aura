import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// PIN de él (admin) y de ella — persisten en memoria durante el proceso
let hisPinHash = bcrypt.hashSync('1234', 10);
let herPinHash = bcrypt.hashSync('5678', 10);

export class AuthController {
  async login(req: Request, res: Response) {
    const { pin } = req.body;
    if (!pin) { res.status(400).json({ error: 'PIN requerido' }); return; }

    const isHis = await bcrypt.compare(String(pin), hisPinHash);
    const isHer = !isHis && await bcrypt.compare(String(pin), herPinHash);

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
    const { currentPin, newPin, target } = req.body; // target: 'him' | 'her'
    const role = (req as any).userRole;

    // Solo él puede cambiar PINs
    if (role !== 'him') { res.status(403).json({ error: 'Solo el administrador puede cambiar PINs' }); return; }

    const isHis = await bcrypt.compare(String(currentPin), hisPinHash);
    if (!isHis) { res.status(401).json({ error: 'PIN actual incorrecto' }); return; }

    const newHash = await bcrypt.hash(String(newPin), 10);
    if (target === 'her') herPinHash = newHash;
    else hisPinHash = newHash;

    res.json({ success: true });
  }
}
