import {
  Role,
  SupportedRegion,
  User,
  UserKycVerification,
} from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator';

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

  @IsBoolean()
  isKycVerified: boolean;
}

type UserInput = User & { verification?: UserKycVerification };

export const toUserDto = (user: UserInput) => {
  const plainUserDto: UserDto = {
    id: user.id,
    avatar: user.avatar,
    username: user.username,
    role: user.role,
    email: user.email,
    isEmailVerified: !!user.emailVerifiedAt,
    region: user.region,
    isKycVerified: !!user.verification,
  };

  const userDto: UserDto = plainToInstance(UserDto, plainUserDto);
  return userDto;
};
