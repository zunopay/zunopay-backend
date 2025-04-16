import { IsString } from 'class-validator';

export class RegisterMerchantDto {
  @IsString()
  displayName: string;

  @IsString()
  vpa: string;
}
