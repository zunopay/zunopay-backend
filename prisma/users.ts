import { Prisma, SupportedRegion } from '@prisma/client';
import { generateCommitment } from './merchants';

// Don't worry champs, these passwords are used only for localhost seeding
export const usersToSeed = async (): Promise<
  Prisma.UserCreateInput
> => (
  {
    username: 'athar',
    email: 'athar.mohammad+local@dreader.io',
    password: '',
    emailVerifiedAt: new Date(),
    region: SupportedRegion.EU,
    registry: {
      create: {
        commitment: generateCommitment('TY00002000002'),
        walletAddress : '7SMfVRrJw75vPzHCQ3ckUCT9igMRre8VHmodTbaVv4R'
      }
    },
  }
);
