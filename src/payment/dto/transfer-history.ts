import { TokenType, Transfer, TransferStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';

export enum TransferType {
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

  @IsString()
  walletAddress: string;

  @IsDate()
  createdAt: Date;

  @IsEnum(TokenType)
  tokenType: TokenType;

  @IsEnum(TransferType)
  type: TransferType;
}

export type TransferHistoryInput = Transfer & { type: TransferType };

export function toTransferHistory(input: TransferHistoryInput) {
  const plainTransferHistoryDto: TransferHistoryDto = {
    id: input.id,
    amount: input.amount,
    status: input.status,
    signature: input.signature,
    createdAt: input.createdAt,
    tokenType: input.tokenType,
    type: input.type,
    walletAddress:
      input.type == TransferType.Sent
        ? input.receiverWalletAddress
        : input.senderWalletAddress,
  };

  const transferHistoryDto: TransferHistoryDto = plainToInstance(
    TransferHistoryDto,
    plainTransferHistoryDto,
  );
  return transferHistoryDto;
}

export function toTransferHistoryArray(inputs: TransferHistoryInput[]) {
  return inputs.map(toTransferHistory);
}
