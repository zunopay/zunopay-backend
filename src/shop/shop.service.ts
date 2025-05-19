import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterShopDto } from './dto/register-shop.dto';
import { PrismaService } from 'nestjs-prisma';
import { UpdateShopDto } from './dto/update-shop.dto';
import { RewardPointTask } from '@prisma/client';

/**
 *
 * 1. Make point system decentivise wrong behaviours by members
 *
 */

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  async register(username: string, body: RegisterShopDto) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { shop: true },
    });

    if (user.shop) {
      throw new BadRequestException(
        'User already has a registered shop',
      );
    }

    const shop = await this.prisma.shop.create({
      data: {
        displayName: body.displayName,
        address: body.address,
        category: body.category,
        user: { connect: { username } },
      },
    });

    return shop;
  }

  async verify(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { shop: true, referredBy: true },
    });

    if (!user.shop) {
      throw new BadRequestException(`User is not a merchant`);
    }

    const shop = await this.prisma.shop.update({
      where: { id: user.shop.id },
      data: { isVerified: true },
    });

    this.rewardUser(
      user.referredBy.referrerId,
      RewardPointTask.ShopOnboarding,
    );
    return shop;
  }

  // TODO: Add filters
  async getShops() {
    const shops = await this.prisma.shop.findMany({
      where: { isVerified: true },
    });
    return shops;
  }

  async update(userId: number, body: UpdateShopDto) {
    const shop = await this.prisma.shop.update({
      where: { userId },
      data: {
        displayName: body.displayName,
        address: body.address,
        category: body.category,
      },
    });

    return shop;
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
