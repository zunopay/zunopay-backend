import { IsString, IsStrongPassword } from 'class-validator';

export class LoginDto {
  @IsString()
  usernameOrEmail: string;

  @IsString()
  @IsStrongPassword()
  password: string;
}
