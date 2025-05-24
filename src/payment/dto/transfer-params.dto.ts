import { IsNumber, IsString } from 'class-validator';
import { TransformStringToNumber } from '../../decorators/transformStringToNumber';

export class TransferParams {
  @IsString()
  id: string;

  @TransformStringToNumber()
  @IsNumber()
  amount: number;
}
