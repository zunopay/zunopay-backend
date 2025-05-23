import { Shop, ShopCategory, ShopStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator';
import { getPublicUrl } from '../../utils/s3';

export class UserShopDto {
  @IsNumber()
  id: number;

  @IsString()
  displayName: string;

  @IsString()
  logo: string;

  @IsString()
  shopFront: string;

  @IsString()
  address: string;

  @IsString()
  taxNumber: string;

  @IsEnum(ShopCategory)
  category: ShopCategory;

  @IsBoolean()
  isVerified: boolean;

  @IsEnum(ShopStatus)
  status: ShopStatus;
}

export function toUserShopDto(input: Shop) {
  const plainUserShopDto: UserShopDto = {
    id: input.id,
    displayName: input.displayName,
    logo: getPublicUrl(input.logo),
    taxNumber: input.taxNumber,
    shopFront: getPublicUrl(input.shopFront),
    address: input.address,
    category: input.category,
    status: input.status,
    isVerified: input.isVerified,
  };

  const userShopDto = plainToInstance(UserShopDto, plainUserShopDto);
  return userShopDto;
}

export function toUserShopDtoArray(inputs: Shop[]) {
  return inputs.map(toUserShopDto);
}
