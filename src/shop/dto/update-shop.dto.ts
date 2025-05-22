import { IntersectionType, PartialType } from '@nestjs/swagger';
import { RegisterShopBodyDto, RegisterShopFileDto } from './register-shop.dto';

export class UpdateShopBodyDto extends PartialType(RegisterShopBodyDto) {}
export class UpdateShopFileDto extends PartialType(RegisterShopFileDto) {}

export class UpdateShopDto extends IntersectionType(
  UpdateShopBodyDto,
  UpdateShopFileDto,
) {}
