import { Role, User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator';
import { IsSolanaAddress } from 'src/decorators/isSolanaAddress';

export class UserDto {
  @IsNumber()
  id: number;

  @IsString()
  username: string;

  @IsString()
  email: string;

  @IsString()
  avatar?: string;

  @IsEnum(Role)
  role: Role;

  @IsBoolean()
  isEmailVerified: boolean;

  @IsSolanaAddress()
  walletAddress: string;
}

export type UserInput = User & { walletAddress: string };

export const toUserDto = (user: UserInput) => {
  const plainUserDto: UserDto = {
    id: user.id,
    avatar: user.avatar,
    username: user.username,
    role: user.role,
    email: user.email,
    isEmailVerified: !!user.emailVerifiedAt,
    walletAddress: user.walletAddress,
  };

  const userDto: UserDto = plainToInstance(UserDto, plainUserDto);
  return userDto;
};
