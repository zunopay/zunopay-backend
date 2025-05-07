import { Merchant, MerchantCategory, MerchantStatus } from '@prisma/client';
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

  @IsEnum(MerchantStatus)
  status: MerchantStatus;
}

export function toMerchantDto(input: Merchant) {
  const plainMerchantDto: MerchantDto = {
    id: input.id,
    displayName: input.displayName,
    logo: input.logo,
    address: input.address,
    category: input.category,
    status: input.status,
  };

  const merchantDto = plainToInstance(MerchantDto, plainMerchantDto);
  return merchantDto;
}

export function toMerchantDtoArray(inputs: Merchant[]) {
  return inputs.map(toMerchantDto);
}
