import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SphereService } from '../third-party/sphere/sphere.service';
import { WebhookService } from '../indexer/webhook/webhook.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, SphereService, WebhookService],
})
export class PaymentModule {}
