import { PartialType } from '@nestjs/swagger';
import { RegisterShopDto } from './register-shop.dto';

export class UpdateShopDto extends PartialType(RegisterShopDto) {}
