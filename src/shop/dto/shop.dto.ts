import { Shop, ShopCategory, ShopStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';

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

export function toShopDto(input: Shop) {
  const plainShopDto: ShopDto = {
    id: input.id,
    displayName: input.displayName,
    logo: input.logo,
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
