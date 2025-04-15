import { IsNumber, IsString } from 'class-validator';
import { TransformStringToNumber } from '../../decorators/transformStringToNumber';

export class TransferParams {
  @IsString()
  walletAddress: string;

  @TransformStringToNumber()
  @IsNumber()
  amount: number;
}
