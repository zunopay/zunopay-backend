import { OmitType } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { IsValidUsername } from '../../decorators/isValidUsername';

export class RegisterDto {
  @IsOptional()
  @IsValidUsername()
  username: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  @IsString()
  password: string;

  @IsString()
  referralCode: string;
}

export class GoogleRegisterDto extends OmitType(RegisterDto, [
  'email',
  'password',
] as const) {}
