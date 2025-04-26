import { PrismaClient, RewardPointTask } from '@prisma/client';
import { ConfigService } from '@nestjs/config'
import { usersToSeed } from './users';

const prisma = new PrismaClient();
const configService = new ConfigService();


async function main() {
  console.info('Emptying the database...');
  const nodeEnv = configService.get<string>("NODE_ENV");

  if(nodeEnv != "dev"){
    throw new Error(`Are you seeding on prod 😨 ? I can't allow that.`);
  }

  await prisma.user.deleteMany();
  console.info('Emptied database!');

  // SEED USERS
  await prisma.user.create({ data: await usersToSeed() });
  console.info('Added users');

  // SEED REWARD SYSTEM
  await prisma.rewardPointSystem.create({ data: { task: RewardPointTask.MerchantOnboarding, points: 5 } })
  await prisma.rewardPointSystem.create({ data: { task: RewardPointTask.EarlyUser, points: 1 } })

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
