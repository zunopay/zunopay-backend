import { Merchant, MerchantKycVerification } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { isNull } from 'lodash';

export class MerchantDto {
  @IsString()
  displayName: string;

  @IsBoolean()
  isKycVerified: boolean;
}

export type MerchantInput = Merchant & {
  verification?: MerchantKycVerification;
};

export function toMerchantDto(input: MerchantInput) {
  const plainMerchantDto: MerchantDto = {
    displayName: input.displayName,
    isKycVerified: !isNull(input.verification),
  };

  const merchantDto = plainToInstance(MerchantDto, plainMerchantDto);
  return merchantDto;
}
