import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const { faker } = await import('@faker-js/faker');

  console.log('🧹 Limpando banco...');
  await prisma.invite.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log('✨ Criando usuários...');
  const alice = await prisma.user.create({
    data: {
      email: 'alice@test.com',
      name: 'Alice',
      passwordHash: await hash('123456', 10),
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@test.com',
      name: 'Bob',
      passwordHash: await hash('123456', 10),
    },
  });

  const tom = await prisma.user.create({
    data: {
      email: 'tom@test.com',
      name: 'Tom',
      passwordHash: await hash('123456', 10),
    },
  });

  console.log('🏢 Criando empresas...');
  const altaaTech = await prisma.company.create({
    data: {
      name: 'AltaaTech',
      logoUrl: faker.image.url(),
    },
  });

  const tomCorp = await prisma.company.create({
    data: {
      name: 'TomCorp',
      logoUrl: faker.image.url(),
    },
  });

  console.log('👥 Criando memberships...');
  await prisma.membership.createMany({
    data: [
      { userId: alice.id, companyId: altaaTech.id, role: 'OWNER' },
      { userId: bob.id, companyId: altaaTech.id, role: 'ADMIN' },
      { userId: tom.id, companyId: tomCorp.id, role: 'OWNER' },
    ],
  });

  console.log('📩 Criando convite fake...');
  await prisma.invite.create({
    data: {
      email: 'carol@test.com',
      token: crypto.randomBytes(32).toString('hex'),
      companyId: altaaTech.id,
      role: 'MEMBER',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedById: alice.id,
    },
  });

  console.log('🔗 Atualizando empresa ativa...');
  await prisma.user.update({
    where: { id: alice.id },
    data: { activeCompanyId: altaaTech.id },
  });
  await prisma.user.update({
    where: { id: tom.id },
    data: { activeCompanyId: tomCorp.id },
  });

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
