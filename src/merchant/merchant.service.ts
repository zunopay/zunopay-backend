import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { PrismaService } from 'nestjs-prisma';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { RewardPointTask } from '@prisma/client';

/**
 *
 * 1. Make point system decentivise wrong behaviours by members
 *
 */

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  async register(username: string, body: RegisterMerchantDto) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { merchant: true },
    });

    if (user.merchant) {
      throw new BadRequestException(
        'Merchant profile already exists for the user',
      );
    }

    const merchant = await this.prisma.merchant.create({
      data: {
        displayName: body.displayName,
        address: body.address,
        category: body.category,
        user: { connect: { username } },
      },
    });

    return merchant;
  }

  async verify(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { merchant: true, referredBy: true },
    });

    if (!user.merchant) {
      throw new BadRequestException(`User doesn't have merchant profile`);
    }

    const merchant = await this.prisma.merchant.update({
      where: { id: user.merchant.id },
      data: { isVerified: true },
    });

    this.rewardUser(
      user.referredBy.referrerId,
      RewardPointTask.StoreOnboarding,
    );
    return merchant;
  }

  // TODO: Add filters
  async getMerchants() {
    const merchants = await this.prisma.merchant.findMany({
      where: { isVerified: true },
    });
    return merchants;
  }

  async update(userId: number, body: UpdateMerchantDto) {
    const merchant = await this.prisma.merchant.update({
      where: { userId },
      data: {
        displayName: body.displayName,
        address: body.address,
        category: body.category,
      },
    });

    return merchant;
  }

  async rewardUser(userId: number, task: RewardPointTask) {
    await this.prisma.userRewardPoints.create({
      data: {
        user: { connect: { id: userId } },
        reward: { connect: { task } },
      },
    });
  }
}
