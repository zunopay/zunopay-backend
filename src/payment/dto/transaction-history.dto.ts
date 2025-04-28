import { Transfer, TransferStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';

export enum TransactionType {
  Sent = 'Sent',
  Received = 'Received',
}

export class TransferHistoryDto {
  @IsNumber()
  id: number;

  @IsNumber()
  amount: number;

  @IsEnum(TransferStatus)
  status: TransferStatus;

  @IsString()
  signature: string;

  @IsDate()
  createdAt: Date;
}

export function toTransferHistory(input: Transfer) {
  const plainTransferHistoryDto: TransferHistoryDto = {
    id: input.id,
    amount: input.amount,
    status: input.status,
    signature: input.signature,
    createdAt: input.createdAt,
  };

  const transferHistoryDto: TransferHistoryDto = plainToInstance(
    TransferHistoryDto,
    plainTransferHistoryDto,
  );
  return transferHistoryDto;
}

export function toTransferHistoryArray(inputs: Transfer[]) {
  return inputs.map(toTransferHistory);
}
