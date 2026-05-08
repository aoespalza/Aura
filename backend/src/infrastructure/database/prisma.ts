import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function connectDatabase() {
  await prisma.$connect();
  console.log('[Aura] Base de datos conectada');
}
