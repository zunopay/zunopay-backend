import { IsString } from 'class-validator';

export class VerifyUserDto {
  @IsString()
  username: string;

  @IsString()
  vpa: string;
}
