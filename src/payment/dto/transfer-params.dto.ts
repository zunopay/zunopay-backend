import { IsNumber, IsString } from 'class-validator';
import { TransformStringToNumber } from '../../decorators/transformStringToNumber';

export class TransferParams {
  @IsString()
  vpa: string;

  @TransformStringToNumber()
  @IsNumber()
  amount: number;
}
