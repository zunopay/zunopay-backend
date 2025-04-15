import { IsString } from 'class-validator';

export class GetReceiverParams {
  @IsString()
  encodedQr: string;
}
