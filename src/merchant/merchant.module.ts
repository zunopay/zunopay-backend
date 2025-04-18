import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { PrivyService } from '../third-party/privy/privy.service';
import { PaymentService } from '../payment/payment.service';

@Module({
  providers: [MerchantService, PrivyService, PaymentService],
  controllers: [MerchantController],
})
export class MerchantModule {}
