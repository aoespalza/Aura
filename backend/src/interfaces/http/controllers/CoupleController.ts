import { Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma';
import { AuthRequest } from '../middleware/auth';

export class CoupleController {
  // POST /couple/invite  { toEmail }  — invitar a la pareja por email
  async invite(req: AuthRequest, res: Response) {
    try {
      const me = await prisma.user.findUnique({ where: { id: req.userId! } });
      if (!me) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
      if (me.coupleId) { res.status(409).json({ error: 'Ya tienes una pareja enlazada' }); return; }

      const toEmail = String(req.body.toEmail || '').trim().toLowerCase();
      if (!toEmail) { res.status(400).json({ error: 'Email requerido' }); return; }
      if (toEmail === me.email) { res.status(400).json({ error: 'No puedes invitarte a ti mismo' }); return; }

      // Evitar invitaciones duplicadas pendientes
      const dup = await prisma.coupleInvite.findFirst({
        where: { fromUserId: me.id, toEmail, status: 'pending' },
      });
      if (dup) { res.json(dup); return; }

      const invite = await prisma.coupleInvite.create({
        data: { fromUserId: me.id, toEmail, status: 'pending' },
      });
      res.json(invite);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // GET /couple/invites  — invitaciones pendientes dirigidas a mi email
  async listForMe(req: AuthRequest, res: Response) {
    try {
      const me = await prisma.user.findUnique({ where: { id: req.userId! } });
      if (!me) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

      const invites = await prisma.coupleInvite.findMany({
        where: { toEmail: me.email, status: 'pending' },
        orderBy: { createdAt: 'desc' },
      });

      // Adjuntar datos del remitente
      const fromIds = invites.map(i => i.fromUserId);
      const senders = await prisma.user.findMany({
        where: { id: { in: fromIds } },
        select: { id: true, name: true, email: true },
      });
      const byId = new Map(senders.map(s => [s.id, s]));
      res.json(invites.map(i => ({ ...i, from: byId.get(i.fromUserId) || null })));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // POST /couple/invites/:id/accept — aceptar y enlazar
  async accept(req: AuthRequest, res: Response) {
    try {
      const me = await prisma.user.findUnique({ where: { id: req.userId! } });
      if (!me) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
      if (me.coupleId) { res.status(409).json({ error: 'Ya tienes una pareja enlazada' }); return; }

      const invite = await prisma.coupleInvite.findUnique({ where: { id: req.params.id } });
      if (!invite || invite.status !== 'pending') { res.status(404).json({ error: 'Invitación no válida' }); return; }
      if (invite.toEmail !== me.email) { res.status(403).json({ error: 'Esta invitación no es para ti' }); return; }

      const inviter = await prisma.user.findUnique({ where: { id: invite.fromUserId } });
      if (!inviter) { res.status(404).json({ error: 'El usuario que invitó ya no existe' }); return; }
      if (inviter.coupleId) { res.status(409).json({ error: 'Quien te invitó ya tiene pareja' }); return; }

      // Crear la pareja y enlazar a ambos
      const coupleName = [inviter.name, me.name].filter(Boolean).join(' & ') || null;
      const result = await prisma.$transaction(async (tx) => {
        const couple = await tx.couple.create({ data: { name: coupleName } });
        await tx.user.update({ where: { id: inviter.id }, data: { coupleId: couple.id } });
        await tx.user.update({ where: { id: me.id }, data: { coupleId: couple.id } });
        await tx.coupleInvite.update({ where: { id: invite.id }, data: { status: 'accepted' } });
        // Cancelar otras invitaciones pendientes de ambos
        await tx.coupleInvite.updateMany({
          where: { status: 'pending', OR: [{ fromUserId: inviter.id }, { fromUserId: me.id }, { toEmail: inviter.email }, { toEmail: me.email }] },
          data: { status: 'rejected' },
        });
        return couple;
      });

      res.json({ success: true, couple: { id: result.id, name: result.name } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // POST /couple/invites/:id/reject
  async reject(req: AuthRequest, res: Response) {
    try {
      const me = await prisma.user.findUnique({ where: { id: req.userId! } });
      if (!me) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
      const invite = await prisma.coupleInvite.findUnique({ where: { id: req.params.id } });
      if (!invite || invite.toEmail !== me.email) { res.status(404).json({ error: 'Invitación no encontrada' }); return; }
      await prisma.coupleInvite.update({ where: { id: invite.id }, data: { status: 'rejected' } });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
