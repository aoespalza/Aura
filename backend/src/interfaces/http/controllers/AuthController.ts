import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../infrastructure/database/prisma';

// PIN simple de acceso — se inicializa con hash del PIN "1234" por defecto
const DEFAULT_PIN_HASH = bcrypt.hashSync('1234', 10);
let storedPinHash = DEFAULT_PIN_HASH;

export class AuthController {
  async login(req: Request, res: Response) {
    const { pin } = req.body;
    if (!pin) { res.status(400).json({ error: 'PIN requerido' }); return; }

    const valid = await bcrypt.compare(String(pin), storedPinHash);
    if (!valid) { res.status(401).json({ error: 'PIN incorrecto' }); return; }

    const token = jwt.sign(
      { id: 'aura-user' },
      process.env.JWT_SECRET || 'aura-secret',
      { expiresIn: '30d' }
    );
    res.json({ token });
  }

  async changePin(req: Request, res: Response) {
    const { currentPin, newPin } = req.body;
    const valid = await bcrypt.compare(String(currentPin), storedPinHash);
    if (!valid) { res.status(401).json({ error: 'PIN actual incorrecto' }); return; }
    storedPinHash = await bcrypt.hash(String(newPin), 10);
    res.json({ success: true });
  }
}
