import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SphereService } from '../third-party/sphere/sphere.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, SphereService],
})
export class PaymentModule {}
