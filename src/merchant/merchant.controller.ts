import { Body, Controller, Get, Patch } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { UserEntity } from '../decorators/user.decorator';
import { UserPayload } from '../auth/dto/authorization.dto';
import { ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '@prisma/client';
import { toMerchantDto } from './dto/merchant.dto';
import { VerifyMerchantDto } from './dto/verify-merchant.dto';

@ApiTags('Merchant')
@Controller('merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @RolesGuard([Role.KycVerifier])
  @Patch('/verify')
  async verify(
    @UserEntity() user: UserPayload,
    @Body() body: VerifyMerchantDto,
  ) {
    await this.merchantService.verify(user, body);
  }

  @RolesGuard([Role.Merchant])
  @Get('get/profile')
  async fetchMe(@UserEntity() user: UserPayload) {
    const me = await this.merchantService.findOneById(user.id);
    return toMerchantDto(me);
  }
}
