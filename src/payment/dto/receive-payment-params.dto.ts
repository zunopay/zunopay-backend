import { IsNumber, IsOptional, IsString } from 'class-validator';
import { TransformStringToNumber } from 'src/decorators/transformStringToNumber';

export class ReceivePaymentParamsDto {
  @TransformStringToNumber()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  message?: string;
}
