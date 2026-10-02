import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../infrastructure/database/prisma';
import { AuthRequest } from '../middleware/auth';

function signToken(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'aura-secret', { expiresIn: '30d' });
}

function publicUser(u: { id: string; email: string; name: string | null; role: string; coupleId: string | null; age: number | null }) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, coupleId: u.coupleId, age: u.age };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthController {
  // POST /auth/register  { email, password, name }
  async register(req: Request, res: Response) {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');
      const name = req.body.name ? String(req.body.name).trim() : null;

      if (!EMAIL_RE.test(email)) { res.status(400).json({ error: 'Email inválido' }); return; }
      if (password.length < 6) { res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' }); return; }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) { res.status(409).json({ error: 'Ese email ya está registrado' }); return; }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({ data: { email, passwordHash, name } });

      res.json({ token: signToken(user.id), user: publicUser(user) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // POST /auth/login  { email, password }
  async login(req: Request, res: Response) {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) { res.status(401).json({ error: 'Credenciales inválidas' }); return; }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) { res.status(401).json({ error: 'Credenciales inválidas' }); return; }

      res.json({ token: signToken(user.id), user: publicUser(user) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // GET /auth/me  — usuario actual + info de pareja
  async me(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: { couple: { include: { users: { select: { id: true, name: true, email: true, role: true } } } } },
      });
      if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
      res.json({
        user: publicUser(user),
        couple: user.couple
          ? { id: user.couple.id, name: user.couple.name, members: user.couple.users }
          : null,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // POST /auth/password  { currentPassword, newPassword }
  async changePassword(req: AuthRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (String(newPassword || '').length < 6) { res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }); return; }

      const user = await prisma.user.findUnique({ where: { id: req.userId! } });
      if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

      const ok = await bcrypt.compare(String(currentPassword || ''), user.passwordHash);
      if (!ok) { res.status(401).json({ error: 'Contraseña actual incorrecta' }); return; }

      const passwordHash = await bcrypt.hash(String(newPassword), 10);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
