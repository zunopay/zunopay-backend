import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SphereService } from '../third-party/sphere/sphere.service';
import { WebhookService } from '../indexer/webhook/webhook.service';
import { IndexerService } from '../indexer/indexer.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, SphereService, WebhookService, IndexerService],
})
export class PaymentModule {}
