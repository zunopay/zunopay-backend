import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { PrivyService } from '../third-party/privy/privy.service';

@Module({
  providers: [MerchantService, PrivyService],
  controllers: [MerchantController],
})
export class MerchantModule {}
