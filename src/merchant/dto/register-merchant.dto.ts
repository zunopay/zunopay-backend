import { ApiProperty } from '@nestjs/swagger';
import { MerchantCategory } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class RegisterMerchantDto {
  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsString()
  address: string;

  @ApiProperty({ enum: MerchantCategory })
  @IsEnum(MerchantCategory)
  category: MerchantCategory;
}
