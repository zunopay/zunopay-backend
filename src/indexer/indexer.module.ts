import { Module } from '@nestjs/common';
import { WebhookService } from './webhook/webhook.service';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  providers: [WebhookService],
  imports: [WebhookModule],
})
export class IndexerModule {}
