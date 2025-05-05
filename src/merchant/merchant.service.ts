import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { PrismaService } from 'nestjs-prisma';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  async register(userId: number, body: RegisterMerchantDto) {
    const isExists = await this.prisma.merchant.findUnique({
      where: { userId },
    });

    if (isExists) {
      throw new BadRequestException(
        'Merchant profile already exists for the user',
      );
    }

    const merchant = await this.prisma.merchant.create({
      data: {
        displayName: body.displayName,
        address: body.address,
        category: body.category,
        user: { connect: { id: userId } },
      },
    });

    return merchant;
  }

  // TODO: Add filters
  async getMerchants() {
    const merchants = await this.prisma.merchant.findMany({ where: { isVerified: true } });
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
