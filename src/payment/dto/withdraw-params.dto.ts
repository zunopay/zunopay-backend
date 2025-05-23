import { IsNumber, IsString } from 'class-validator';
import { TransformStringToNumber } from 'src/decorators/transformStringToNumber';

export class WithdrawParams {
  @IsString()
  destinationAddress: string;

  @TransformStringToNumber()
  @IsNumber()
  amount: number;
}
