import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { ShopCategory } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class RegisterShopBodyDto {
  @IsString()
  displayName: string;

  @IsString()
  address: string;

  @IsString()
  taxNumber: string;

  @ApiProperty({ enum: ShopCategory })
  @IsEnum(ShopCategory)
  category: ShopCategory;
}

export class RegisterShopFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @Transform(({ value }) => value[0])
  shopFront: Express.Multer.File;

  @ApiProperty({ type: 'string', format: 'binary' })
  @Transform(({ value }) => value[0])
  @IsOptional()
  logo?: Express.Multer.File | null;
}

export class RegisterShopDto extends IntersectionType(
  RegisterShopBodyDto,
  RegisterShopFileDto,
) {}
