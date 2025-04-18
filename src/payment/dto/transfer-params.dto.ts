import { IsNumber, IsString } from 'class-validator';
import { TransformStringToNumber } from '../../decorators/transformStringToNumber';

export class TransferParams {
  @IsString()
  walletAddress: string;

  @TransformStringToNumber()
  @IsNumber()
  amount: number;
}

export class TransferWithVpaParams {
  @IsString()
  vpa: string;

  @TransformStringToNumber()
  @IsNumber()
  amount: number;
}
