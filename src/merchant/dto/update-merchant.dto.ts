import { PartialType } from '@nestjs/swagger';
import { RegisterMerchantDto } from './register-merchant.dto';

export class UpdateMerchantDto extends PartialType(RegisterMerchantDto) {}
