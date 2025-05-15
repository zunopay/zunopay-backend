import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { MerchantService } from './merchant.service';
import { toMerchantDto, toMerchantDtoArray } from './dto/merchant.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @RolesGuard([Role.Member])
  @Post('/register/:username')
  async register(
    @Param('username') username: string,
    @Body() body: RegisterMerchantDto,
  ) {
    const merchant = await this.merchantService.register(username, body);
    return toMerchantDto(merchant);
  }

  @Get('/get')
  async getMerchants() {
    const merchants = await this.merchantService.getMerchants();
    return toMerchantDtoArray(merchants);
  }

  @RolesGuard([Role.Admin])
  @Patch('/verify/:username')
  async verify(@Param('username') username: string) {
    const merchant = await this.merchantService.verify(username);
    return merchant;
  }
}
