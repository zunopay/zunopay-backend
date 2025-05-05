import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
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

  @RolesGuard([Role.Admin])
  @Post('/register')
  async register(
    @Body() body: RegisterMerchantDto,
    @UserEntity() user: UserPayload,
  ) {
    const merchant = await this.merchantService.register(user.id, body);
    return toMerchantDto(merchant);
  }

  @Get('/get')
  async getMerchants() {
    const merchants = await this.merchantService.getMerchants();
    return toMerchantDtoArray(merchants);
  }

  @RolesGuard([Role.Admin])
  @Patch('/update')
  async update(
    @Body() body: UpdateMerchantDto,
    @UserEntity() user: UserPayload,
  ) {
    const merchant = await this.merchantService.update(user.id, body);
    return toMerchantDto(merchant);
  }
}
