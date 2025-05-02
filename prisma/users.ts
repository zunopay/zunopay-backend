import { Prisma, SupportedRegion } from '@prisma/client';
import { sha256 } from 'js-sha256';

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
    wallet : {
      create:{
        address: '7SMfVRrJw75vPzHCQ3ckUCT9igMRre8VHmodTbaVv4R',
        lastInteractedAt: new Date()
      }
    },
    registry: {
      create: {
        commitment: generateCommitment('TY00002000002'),
      }
    },
  }
);

export function generateCommitment(vpa: string) {
  const data = `#${vpa}#`;
  return sha256(data);
}
