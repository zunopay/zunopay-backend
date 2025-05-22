import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import {
  RegisterShopBodyDto,
  RegisterShopDto,
  RegisterShopFileDto,
} from './dto/register-shop.dto';
import { ShopService } from './shop.service';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '@prisma/client';
import { toShopDto, toShopDtoArray } from './dto/shop.dto';
import { UserEntity } from '../decorators/user.decorator';
import { UserPayload } from '../auth/dto/authorization.dto';
import { UserAuth } from '../guards/user-auth';
import { ApiConsumes } from '@nestjs/swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiFilesWithBody } from '../decorators/api-file-with-body.decorator';
import {
  UpdateShopBodyDto,
  UpdateShopDto,
  UpdateShopFileDto,
} from './dto/update-shop.dto';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @UserAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor({}))
  @Post('/register')
  async register(
    @ApiFilesWithBody({
      fileFields: ['shopFront', 'logo'],
      bodyType: RegisterShopBodyDto,
      fileType: RegisterShopFileDto,
    })
    body: RegisterShopDto,
    @UserEntity() user: UserPayload,
  ) {
    const shop = await this.shopService.register(user.id, body);
    return toShopDto(shop);
  }

  @RolesGuard([Role.Merchant])
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor({}))
  @Post('/update')
  async update(
    @ApiFilesWithBody({
      fileFields: ['shopFront', 'logo'],
      bodyType: UpdateShopBodyDto,
      fileType: UpdateShopFileDto,
    })
    body: UpdateShopDto,
    @UserEntity() user: UserPayload,
  ) {
    const shop = await this.shopService.update(user.id, body);
    return toShopDto(shop);
  }

  @Get('/get')
  async getShops() {
    const shops = await this.shopService.getShops();
    return toShopDtoArray(shops);
  }

  @Get('/get/:slug')
  async getShop(@Param('slug') slug: string) {
    const shop = await this.shopService.getShop(slug);
    return toShopDto(shop);
  }

  @RolesGuard([Role.Admin])
  @Patch('/verify/:username')
  async verify(@Param('username') username: string) {
    const shop = await this.shopService.verify(username);
    return shop;
  }
}
