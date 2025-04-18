import { ApiProperty } from '@nestjs/swagger';
import { Role, SupportedRegion, User } from '@prisma/client';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  MerchantDto,
  MerchantInput,
  toMerchantDto,
} from 'src/merchant/dto/merchant.dto';

export class UserDto {
  @IsNumber()
  id: number;

  @IsString()
  username: string;

  @IsString()
  email: string;

  @IsString()
  avatar: string;

  @IsEnum(Role)
  role: Role;

  @IsBoolean()
  isEmailVerified: boolean;

  @IsEnum(SupportedRegion)
  region: SupportedRegion;

  @IsOptional()
  @ApiProperty({ type: MerchantDto })
  @Type(() => MerchantDto)
  merchant?: MerchantDto;
}

type UserInput = User & { merchant?: MerchantInput };

export const toUserDto = (user: UserInput) => {
  const plainUserDto: UserDto = {
    id: user.id,
    avatar: user.avatar,
    username: user.username,
    role: user.role,
    email: user.email,
    isEmailVerified: !!user.emailVerifiedAt,
    region: user.region,
    merchant: user.merchant ? toMerchantDto(user.merchant) : null,
  };

  const userDto: UserDto = plainToInstance(UserDto, plainUserDto);
  return userDto;
};
