import { Shop, ShopCategory, ShopStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator';
import { getPublicUrl } from '../../utils/s3';

export class ShopDto {
  @IsNumber()
  id: number;

  @IsString()
  displayName: string;

  @IsString()
  logo: string;

  @IsString()
  address: string;

  @IsEnum(ShopCategory)
  category: ShopCategory;

  @IsEnum(ShopStatus)
  status: ShopStatus;
}

export type ShopInput = Shop;

export function toShopDto(input: ShopInput) {
  const plainShopDto: ShopDto = {
    id: input.id,
    displayName: input.displayName,
    logo: getPublicUrl(input.logo),
    address: input.address,
    category: input.category,
    status: input.status,
  };

  const shopDto = plainToInstance(ShopDto, plainShopDto);
  return shopDto;
}

export function toShopDtoArray(inputs: Shop[]) {
  return inputs.map(toShopDto);
}
