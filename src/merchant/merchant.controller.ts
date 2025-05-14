import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { UserPayload } from 'src/auth/dto/authorization.dto';
import { MerchantService } from './merchant.service';
import { toMerchantDto, toMerchantDtoArray } from './dto/merchant.dto';
import { UserEntity } from 'src/decorators/user.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from '@prisma/client';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@Controller('merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @RolesGuard([Role.Member])
  @Post('/register/:username')
  async register(
    @Param('username') username: string,
    @Body() body: RegisterMerchantDto,
    @UserEntity() referrer: UserPayload,
  ) {
    const merchant = await this.merchantService.register(username, body, referrer.id);
    return toMerchantDto(merchant);
  }

  @Get('/get')
  async getMerchants() {
    const merchants = await this.merchantService.getMerchants();
    return toMerchantDtoArray(merchants);
  }
}
