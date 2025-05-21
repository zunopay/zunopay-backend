import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterShopDto } from './dto/register-shop.dto';
import { PrismaService } from 'nestjs-prisma';
import { UpdateShopDto } from './dto/update-shop.dto';
import { RewardPointTask, Role } from '@prisma/client';
import { S3Service } from '../third-party/s3/s3.service';
import { appendTimestamp } from '../utils/general';
import { kebabCase } from 'lodash';

/**
 *
 * 1. Make point system decentivise wrong behaviours by members
 *
 */

function getS3Folder(userSlug: string, shopSlug: string) {
  return `user/${userSlug}/shop/${shopSlug}`;
}

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async register(userId: number, body: RegisterShopDto) {
    const { logo, shopFront, taxNumber, displayName, category, address } = body;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { shop: true },
    });

    if (user.shop) {
      throw new BadRequestException('User already has a registered shop');
    }

    const slug = kebabCase(displayName);
    const s3BucketSlug = appendTimestamp(slug);

    let logoKey: string, shopFrontKey: string;
    const s3Folder = getS3Folder(user.s3BucketSlug, s3BucketSlug);

    if (logo) {
      logoKey = await this.s3.uploadFile(logo, { s3Folder });
    }

    if (shopFront) {
      shopFrontKey = await this.s3.uploadFile(shopFront, { s3Folder });
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        role: Role.Merchant,
        shop: {
          create: {
            displayName: displayName,
            slug,
            taxNumber: taxNumber,
            address: address,
            category: category,
            logo: logoKey,
            shopFront: shopFrontKey,
            s3BucketSlug,
          },
        },
      },
      include: { shop: true },
    });

    return updatedUser.shop;
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

    this.rewardUser(user.referredBy.referrerId, RewardPointTask.ShopOnboarding);
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
    const { logo, shopFront, ...rest } = body;

    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!shop) {
      throw new NotFoundException(`User doesn't have a registered shop`);
    }

    let logoKey: string, shopFrontKey: string, slug: string;
    const s3Folder = getS3Folder(shop.user.s3BucketSlug, shop.s3BucketSlug);

    if (logo) {
      logoKey = await this.s3.uploadFile(logo, { s3Folder });
    }

    if (shopFront) {
      shopFrontKey = await this.s3.uploadFile(shopFront, { s3Folder });
    }

    if (rest.displayName) {
      slug = kebabCase(rest.displayName);
    }

    // Re verify the details if important info is changed
    const isVerified = !(rest.address || rest.taxNumber) && shop.isVerified;

    const updatedShop = await this.prisma.shop.update({
      where: { userId },
      data: {
        ...rest,
        slug,
        logo: logoKey,
        shopFront: shopFrontKey,
        isVerified,
      },
    });

    return updatedShop;
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
