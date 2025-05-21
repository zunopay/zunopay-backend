import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RegisterShopDto } from './dto/register-shop.dto';
import { ShopService } from './shop.service';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '@prisma/client';
import { toShopDto, toShopDtoArray } from './dto/shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UserEntity } from '../decorators/user.decorator';
import { UserPayload } from '../auth/dto/authorization.dto';
import { UserAuth } from '../guards/user-auth';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @UserAuth()
  @Post('/register')
  async register(
    @Body() body: RegisterShopDto,
    @UserEntity() user: UserPayload,
  ) {
    const shop = await this.shopService.register(user.id, body);
    return toShopDto(shop);
  }

  @RolesGuard([Role.Merchant])
  @Post('/update')
  async update(@Body() body: UpdateShopDto, @UserEntity() user: UserPayload) {
    const shop = await this.shopService.update(user.id, body);
    return toShopDto(shop);
  }

  @Get('/get')
  async getShops() {
    const shops = await this.shopService.getShops();
    return toShopDtoArray(shops);
  }

  @RolesGuard([Role.Admin])
  @Patch('/verify/:username')
  async verify(@Param('username') username: string) {
    const shop = await this.shopService.verify(username);
    return shop;
  }
}
