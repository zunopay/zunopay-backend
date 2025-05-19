import { ApiProperty } from '@nestjs/swagger';
import { ShopCategory } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class RegisterShopDto {
  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsString()
  address: string;

  @ApiProperty({ enum: ShopCategory })
  @IsEnum(ShopCategory)
  category: ShopCategory;
}
