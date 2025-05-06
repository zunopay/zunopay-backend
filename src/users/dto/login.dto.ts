import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  usernameOrEmail: string;

  @IsString()
  password: string;
}
