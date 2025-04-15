import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { UserPayload } from '../auth/dto/authorization.dto';
import { generateCommitment } from 'src/utils/hash';

@Injectable()
export class MerchantService {
  /**
   * Onboarding flow:
   *
   * 1. Perform checks
   * 2. Create wallet and vpa commitment
   * 3. Register
   *
   * -- Only when offramping.
   * 1. Create customer
   * 2. Generate TOS
   * 3. KYB
   * 4. Create Offramp provider wallet account
   * 5. Create Offramp provider bank account
   * */

  constructor(private readonly prisma: PrismaService) {}

  async register(kycVerifier: UserPayload, body: RegisterMerchantDto) {
    const { vpa, businessDisplayName, username } = body;
    const commitment = generateCommitment(vpa);

    // check if vpa already exists
    const isCommitmentExists = await this.prisma.keyWalletRegistry.findUnique({
      where: { commitment },
    });
    if (isCommitmentExists) {
      throw new BadRequestException(
        ' Payment address already exists, use different payment address for this account. Contact us if not you ',
      );
    }

    const verifierData = await this.prisma.kycVerifier.findUnique({
      where: { userId: kycVerifier.id },
    });
    if (!verifierData || verifierData?.deletedAt) {
      throw new UnauthorizedException();
    }

    //TODO: create wallet for merchants
    const merchant = await this.prisma.merchant.create({
      data: {
        displayName: businessDisplayName,
        user: { connect: { username } },
        verification: {
          create: {
            verifier: { connect: { id: verifierData.id } },
          },
        },
        registry: {
          // TODO: put the generated wallet
          create: { commitment, walletAddress: '' },
        },
      },
    });

    return merchant;
  }
}
