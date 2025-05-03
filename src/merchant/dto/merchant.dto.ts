import { Merchant, MerchantCategory } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class MerchantDto {
  @IsNumber()
  id: number;

  @IsString()
  displayName: string;

  @IsString()
  logo: string;

  @IsString()
  address: string;

  @IsEnum(MerchantCategory)
  category: MerchantCategory;
}

export function toMerchantDto(input: Merchant) {
  const plainMerchantDto: MerchantDto = {
    id: input.id,
    displayName: input.displayName,
    logo: input.logo,
    address: input.address,
    category: input.category,
  };

  const merchantDto = plainToInstance(MerchantDto, plainMerchantDto);
  return merchantDto;
}

export function toMerchantDtoArray(inputs: Merchant[]) {
  return inputs.map(toMerchantDto);
}
