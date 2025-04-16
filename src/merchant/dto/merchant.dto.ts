import { Merchant, MerchantKycVerification, User } from '@prisma/client';
import { plainToInstance, Type } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { isNull } from 'lodash';
import { toUserDto, UserDto } from 'src/users/dto/user.dto';

export class MerchantDto {
  @IsString()
  displayName: string;

  @IsBoolean()
  isKycVerified: boolean;

  @Type(() => UserDto)
  user: UserDto;
}

export type MerchantInput = { user: User } & Merchant & {
    verification: MerchantKycVerification;
  };

export function toMerchantDto(input: MerchantInput) {
  const plainMerchantDto: MerchantDto = {
    displayName: input.displayName,
    isKycVerified: !isNull(input.verification),
    user: toUserDto(input.user),
  };

  const merchantDto = plainToInstance(MerchantDto, plainMerchantDto);
  return merchantDto;
}
