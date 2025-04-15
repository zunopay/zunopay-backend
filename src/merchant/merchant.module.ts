import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';

@Module({
  providers: [MerchantService],
  controllers: [MerchantController],
})
export class MerchantModule {}
