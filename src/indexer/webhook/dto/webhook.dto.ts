import { ApiProperty } from '@nestjs/swagger';
import { plainToInstance, Type } from 'class-transformer';
import { TransactionType, Webhook, WebhookType } from 'helius-sdk';

import {
  IsArray,
  IsUrl,
  IsOptional,
  IsString,
  ArrayNotEmpty,
  IsEnum,
} from 'class-validator';
import { IsSolanaAddress } from '../../../decorators/isSolanaAddress';

export class WebhookDto {
  @IsString()
  webhookID: string;

  @IsSolanaAddress()
  wallet: string;

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => String)
  accountAddresses: string[];

  @IsArray()
  @Type(() => String)
  @ApiProperty({ default: [TransactionType.ANY] })
  transactionTypes: string[];

  @IsUrl()
  webhookURL: string;

  @IsOptional()
  @IsEnum(WebhookType)
  @ApiProperty({ enum: WebhookType })
  webhookType?: WebhookType;

  @IsString()
  @IsOptional()
  authHeader?: string;
}

export function toWebhookDto(webhook: Webhook) {
  const webhookDto = plainToInstance(WebhookDto, webhook);
  return webhookDto;
}

export const toWebhookDtoArray = (webhooks: Webhook[]) => {
  return Promise.all(webhooks.map(toWebhookDto));
};
