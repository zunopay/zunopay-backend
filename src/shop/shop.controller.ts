import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RegisterShopDto } from './dto/register-shop.dto';
import { ShopService } from './shop.service';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role } from '@prisma/client';
import { toShopDto, toShopDtoArray } from './dto/shop.dto';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @RolesGuard([Role.Member])
  @Post('/register/:username')
  async register(
    @Param('username') username: string,
    @Body() body: RegisterShopDto,
  ) {
    const shop = await this.shopService.register(username, body);
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
