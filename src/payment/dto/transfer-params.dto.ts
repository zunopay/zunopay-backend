import { IsNumber, IsString } from 'class-validator';
import { TransformStringToNumber } from '../../decorators/transformStringToNumber';

export class TransferParams {
  @IsString()
  username: string;

  @TransformStringToNumber()
  @IsNumber()
  amount: number;
}
