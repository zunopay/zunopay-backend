import { IsString } from 'class-validator';

export class VerifyMerchantDto {
  @IsString()
  username: string;

  @IsString()
  vpa: string;
}
