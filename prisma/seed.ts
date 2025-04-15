import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config'
import { usersToSeed } from './users';
import { merchantToSeed } from './merchants';

const prisma = new PrismaClient();
const configService = new ConfigService();


async function main() {
  console.info('Emptying the database...');
  const nodeEnv = configService.get<string>("NODE_ENV");

  if(nodeEnv != "dev"){
    throw new Error(`Are you seeding on prod 😨 ? I can't allow that.`);
  }

  await prisma.merchant.deleteMany()
  await prisma.user.deleteMany();
  console.info('Emptied database!');

  // SEED USERS
  await prisma.user.create({ data: await usersToSeed() });
  console.info('Added users');


  // SEED MERCHANTS
  await prisma.user.create({ data: await merchantToSeed() });
  console.info('Added merchants');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
