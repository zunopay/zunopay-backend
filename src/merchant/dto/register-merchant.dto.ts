import { IsString } from 'class-validator';

export class RegisterMerchantDto {
  @IsString()
  username: string;

  @IsString()
  businessDisplayName: string;

  @IsString()
  vpa: string;
}
