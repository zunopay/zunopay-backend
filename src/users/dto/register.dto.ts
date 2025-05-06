import { ApiProperty, OmitType } from '@nestjs/swagger';
import { SupportedRegion } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { IsValidUsername } from '../../decorators/isValidUsername';

enum AllowedRole {
  Merchant = 'Merchant',
  Individual = 'Individual',
}

export class RegisterDto {
  @IsOptional()
  @IsValidUsername()
  username: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  @IsString()
  password: string;

  @ApiProperty({ enum: SupportedRegion })
  @IsEnum(SupportedRegion)
  region: SupportedRegion;

  @ApiProperty({ enum: AllowedRole })
  @IsEnum(AllowedRole)
  role: AllowedRole;

  @IsString()
  referralCode: string;
}

export class GoogleRegisterDto extends OmitType(RegisterDto, [
  'email',
  'password',
] as const) {}
