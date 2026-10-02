/**
 * Migración única: convierte los datos existentes (una sola pareja, modelo viejo
 * con PIN) al modelo multi-tenant. Crea una Couple, dos Users (email+contraseña)
 * y asigna a esa pareja todos los registros que estén sin coupleId.
 *
 * Uso (en el VPS, dentro de backend/):
 *   OWNER_EMAIL=tu@email.com OWNER_PASSWORD=secreta \
 *   PARTNER_EMAIL=ella@email.com PARTNER_PASSWORD=secreta2 \
 *   COUPLE_NAME="Nosotros" \
 *   node scripts/migrate-existing.js
 *
 * Es idempotente: si el owner ya existe, no vuelve a crear ni reasigna.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = (process.env.OWNER_EMAIL || '').trim().toLowerCase();
  const ownerPass = process.env.OWNER_PASSWORD || '';
  const partnerEmail = (process.env.PARTNER_EMAIL || '').trim().toLowerCase();
  const partnerPass = process.env.PARTNER_PASSWORD || '';
  const coupleName = process.env.COUPLE_NAME || null;

  if (!ownerEmail || !ownerPass || !partnerEmail || !partnerPass) {
    console.error('Faltan variables: OWNER_EMAIL, OWNER_PASSWORD, PARTNER_EMAIL, PARTNER_PASSWORD');
    process.exit(1);
  }

  const existingOwner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (existingOwner && existingOwner.coupleId) {
    console.log('El owner ya existe y tiene pareja. Nada que migrar.');
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const couple = await tx.couple.create({ data: { name: coupleName } });

    const owner = await tx.user.upsert({
      where: { email: ownerEmail },
      update: { coupleId: couple.id, role: 'owner' },
      create: { email: ownerEmail, passwordHash: await bcrypt.hash(ownerPass, 10), role: 'owner', coupleId: couple.id },
    });
    const partner = await tx.user.upsert({
      where: { email: partnerEmail },
      update: { coupleId: couple.id, role: 'partner' },
      create: { email: partnerEmail, passwordHash: await bcrypt.hash(partnerPass, 10), role: 'partner', coupleId: couple.id },
    });

    // Reasignar todos los registros sin pareja
    const e = await tx.dailyEntry.updateMany({ where: { coupleId: null }, data: { coupleId: couple.id } });
    const p = await tx.periodCycle.updateMany({ where: { coupleId: null }, data: { coupleId: couple.id } });
    const s = await tx.specialDate.updateMany({ where: { coupleId: null }, data: { coupleId: couple.id } });

    // Migrar config de perfil de SystemConfig -> CoupleConfig
    const KEYS = ['profile_age', 'profile_max_age', 'intimacy_min_per_encounter'];
    let cfgMoved = 0;
    for (const key of KEYS) {
      const row = await tx.systemConfig.findUnique({ where: { key } });
      if (row) {
        await tx.coupleConfig.upsert({
          where: { coupleId_key: { coupleId: couple.id, key } },
          update: { value: row.value },
          create: { coupleId: couple.id, key, value: row.value },
        });
        cfgMoved++;
      }
    }

    return { couple, owner, partner, entries: e.count, cycles: p.count, special: s.count, cfgMoved };
  });

  console.log('✓ Migración completada');
  console.log(`  Pareja:        ${result.couple.id} (${result.couple.name || 'sin nombre'})`);
  console.log(`  Owner:         ${result.owner.email}`);
  console.log(`  Partner:       ${result.partner.email}`);
  console.log(`  Entradas:      ${result.entries}`);
  console.log(`  Ciclos:        ${result.cycles}`);
  console.log(`  Fechas esp.:   ${result.special}`);
  console.log(`  Config perfil: ${result.cfgMoved}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
