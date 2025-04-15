import { Body, Controller, Post } from '@nestjs/common';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { MerchantService } from './merchant.service';
import { UserEntity } from '../decorators/user.decorator';
import { UserPayload } from '../auth/dto/authorization.dto';
import { ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Merchant')
@Controller('merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @RolesGuard([Role.KycVerifier])
  @Post('/register')
  async register(
    @UserEntity() user: UserPayload,
    @Body() body: RegisterMerchantDto,
  ) {
    const merchant = await this.merchantService.register(user, body);
    // TODO: Return merchant dto
    return merchant;
  }
}
