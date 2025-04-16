import { ApiProperty, OmitType } from '@nestjs/swagger';
import { SupportedRegion } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { IsValidUsername } from '../../decorators/isValidUsername';

export class RegisterDto {
  @IsOptional()
  @IsValidUsername()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;

  @ApiProperty({ enum: SupportedRegion })
  @IsEnum(SupportedRegion)
  region: SupportedRegion;
}

export class GoogleRegisterDto extends OmitType(RegisterDto, [
  'email',
  'password',
] as const) {}
