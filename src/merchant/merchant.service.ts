import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { UserPayload } from '../auth/dto/authorization.dto';
import { generateCommitment } from '../utils/hash';
import { VerifyMerchantDto } from './dto/verify-merchant.dto';

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

  async register(userId: number, body: RegisterMerchantDto) {
    const { vpa, displayName } = body;
    const commitment = generateCommitment(vpa);

    // check if verified vpa already exists
    const isCommitmentExists = await this.prisma.keyWalletRegistry.findUnique({
      where: { commitment, merchant: { verification: { isNot: null } } },
    });

    if (isCommitmentExists) {
      throw new BadRequestException(
        ' Payment address already exists, use different payment address for this account. Contact us if not you ',
      );
    }

    const merchant = await this.prisma.merchant.create({
      data: {
        displayName: displayName,
        user: { connect: { id: userId } },
        registry: {
          // User empty walletaddress until verified
          create: { commitment, walletAddress: '' },
        },
      },
      include: { user: true, verification: true },
    });

    return merchant;
  }

  async verify(kycVerifier: UserPayload, body: VerifyMerchantDto) {
    const { vpa, username } = body;
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { merchant: { include: { registry: true } } },
    });

    if (!user) {
      throw new NotFoundException(' User does not exists ');
    }

    if (!user.merchant) {
      throw new NotFoundException(' User does not have a merchant profile ');
    }

    const verifierData = await this.prisma.kycVerifier.findUnique({
      where: { userId: kycVerifier.id },
    });

    if (!verifierData || verifierData?.deletedAt) {
      throw new UnauthorizedException();
    }

    const commitment = generateCommitment(vpa);

    if (user.merchant.registry.commitment != commitment) {
      throw new BadRequestException("Virtual private address doesn't match");
    }

    // TODO: Generate wallet address
    await this.prisma.merchant.update({
      where: { id: user.merchant.id },
      data: {
        verification: {
          create: {
            verifier: { connect: { id: verifierData.id } },
          },
        },
        registry: {
          // TODO: put the generated wallet
          update: { walletAddress: '' },
        },
      },
    });
  }

  async findOneById(userId: number) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
      include: { verification: true, user: true },
    });

    return merchant;
  }
}
