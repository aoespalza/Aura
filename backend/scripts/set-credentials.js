/**
 * Ajusta email/contraseña/nombre de las dos cuentas de la pareja existente.
 * Útil si la migración se corrió con valores de ejemplo.
 *
 * Uso (en backend/):
 *   OWNER_EMAIL=... OWNER_PASSWORD=... OWNER_NAME="Andrés" \
 *   PARTNER_EMAIL=... PARTNER_PASSWORD=... PARTNER_NAME="..." \
 *   node scripts/set-credentials.js
 *
 * Cualquiera que no pases, se deja igual. Identifica por rol (owner/partner).
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function setOne(role, email, pass, name) {
  if (!email && !pass && !name) { console.log(`(${role}: nada que cambiar)`); return; }
  const user = await prisma.user.findFirst({ where: { role } });
  if (!user) { console.log(`✗ no existe usuario con rol ${role}`); return; }
  const data = {};
  if (email) data.email = String(email).trim().toLowerCase();
  if (pass)  data.passwordHash = await bcrypt.hash(String(pass), 10);
  if (name)  data.name = String(name);
  await prisma.user.update({ where: { id: user.id }, data });
  console.log(`✓ ${role} actualizado${email ? ` -> ${data.email}` : ''}`);
}

async function main() {
  await setOne('owner',   process.env.OWNER_EMAIL,   process.env.OWNER_PASSWORD,   process.env.OWNER_NAME);
  await setOne('partner', process.env.PARTNER_EMAIL, process.env.PARTNER_PASSWORD, process.env.PARTNER_NAME);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
