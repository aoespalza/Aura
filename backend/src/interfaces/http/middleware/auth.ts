import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../infrastructure/database/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;        // 'owner' | 'partner'
  coupleId?: string | null; // pareja a la que pertenece (null si aún no enlazado)
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Token requerido' }); return; }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aura-secret') as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) { res.status(401).json({ error: 'Usuario no encontrado' }); return; }
    req.userId = user.id;
    req.userRole = user.role;
    req.coupleId = user.coupleId;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Exige que el usuario ya tenga pareja; si no, 409 para que el front muestre "enlaza tu pareja"
export const requireCouple = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.coupleId) { res.status(409).json({ error: 'Aún no tienes pareja enlazada', code: 'NO_COUPLE' }); return; }
  next();
};
