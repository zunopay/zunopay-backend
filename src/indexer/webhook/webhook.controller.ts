import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EnrichedTransaction } from 'helius-sdk';
import { RolesGuard } from '../../guards/roles.guard';
import { Role } from '@prisma/client';
import { WebhookAuth } from '../../guards/webhook-auth.guard';
import { WebhookService } from './webhook.service';
import { toWebhookDtoArray, WebhookDto } from './dto/webhook.dto';

@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @RolesGuard([Role.Admin])
  @Get('get')
  async findAll(): Promise<WebhookDto[]> {
    const webhooks = await this.webhookService.findAll();
    return toWebhookDtoArray(webhooks);
  }

  //   @WebhookAuth()
  @Post('handle')
  async handle(@Body() enrichedTransactions: EnrichedTransaction[]) {
    await this.webhookService.handleWebhookEvent(enrichedTransactions);
  }
}
