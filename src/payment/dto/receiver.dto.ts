import { plainToInstance } from 'class-transformer';
import { ReceiverBankingDetail } from './types';
import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../types/payment';

export class ReceiverDto {
  @IsString()
  vpa: string; // iban/upi id/ pix id

  @IsString()
  name: string;

  @IsString()
  walletAddress: string;

  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  currency: Currency;
}

export function toReceiverDto(input: ReceiverBankingDetail) {
  const plainReceiverDto: ReceiverDto = {
    vpa: input.vpa,
    name: input.name,
    walletAddress: input.walletAddress,
    currency: input.currency,
  };

  const receiverDto = plainToInstance(ReceiverDto, plainReceiverDto);
  return receiverDto;
}
