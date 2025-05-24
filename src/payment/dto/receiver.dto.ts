import { plainToInstance } from 'class-transformer';
import { IsString } from 'class-validator';
import { User } from '@prisma/client';
import { getPublicUrl } from 'src/utils/s3';

export class ReceiverDto {
  @IsString()
  id: string;

  @IsString()
  avatar?: string;
}

export type ReceiverInput = { id: string; avatar?: string };

export function toReceiverDto(input: ReceiverInput) {
  const plainReceiverDto: ReceiverDto = {
    id: input.id,
    avatar: input.avatar ? getPublicUrl(input.avatar) : undefined,
  };

  const receiverDto = plainToInstance(ReceiverDto, plainReceiverDto);
  return receiverDto;
}
