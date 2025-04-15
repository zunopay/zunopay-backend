import { Prisma, SupportedRegion } from '@prisma/client';
import { sha256 } from 'js-sha256'

export function generateCommitment(vpa: string) {
  const data = `#${vpa}#`;
  return sha256(data);
}
// Don't worry champs, these passwords are used only for localhost seeding
export const merchantToSeed = async (): Promise<Prisma.UserCreateInput> => {
  const walletAddress = "AAakp7YKDsNreEvrQAyEh46XM8S8HpRRTMUHTn3sET3d";

  return {
    username: 'athar_merchant',
    email: 'athar.mohammad+merchant@dreader.io',
    password: '',
    emailVerifiedAt: new Date(),
    region: SupportedRegion.EU,
    registry: {
      create: {
        commitment: generateCommitment('TY00000010001'),
        walletAddress
      }
    },
    merchant: {
      create:{
        displayName: "Burgers & Fries",
        registry: {
          connectOrCreate: {
            where: {
              commitment: generateCommitment('TY00000000000')
            },
            create: {
              commitment: generateCommitment('TY00000000000'),
              walletAddress
            },
          }
        }
        /* TODO: Add more details for offramp testing */
      }
    }
  }
}


