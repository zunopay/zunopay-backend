import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { PrismaService } from 'nestjs-prisma';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    username: string,
    body: RegisterMerchantDto,
    referrerId: number,
  ) {
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
      include: { merchant: true },
    });

    if (user.merchant) {
      throw new BadRequestException(
        'Merchant profile already exists for the user',
      );
    }

    const merchant = await this.prisma.merchant.update({
      where: { id: user.merchant.id },
      data: { isVerified: true },
    });

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
}
