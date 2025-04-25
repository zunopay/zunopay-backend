import { PickType } from '@nestjs/swagger';
import { WebhookDto } from './webhook.dto';

export class CreateWebhookDto extends PickType(WebhookDto, [
  'webhookURL',
  'accountAddresses',
]) {}
