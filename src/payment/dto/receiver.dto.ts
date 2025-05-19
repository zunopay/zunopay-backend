import { plainToInstance } from 'class-transformer';
import { IsString } from 'class-validator';
import { User } from '@prisma/client';

export class ReceiverDto {
  @IsString()
  username: string;

  @IsString()
  walletAddress: string;

  @IsString()
  avatar?: string;
}

export type ReceiverInput = User & { walletAddress: string };

export function toReceiverDto(input: ReceiverInput) {
  const plainReceiverDto: ReceiverDto = {
    username: input.username,
    walletAddress: input.walletAddress,
    avatar: input.avatar,
  };

  const receiverDto = plainToInstance(ReceiverDto, plainReceiverDto);
  return receiverDto;
}
