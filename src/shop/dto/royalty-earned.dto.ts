import { IsNumber } from 'class-validator';
import { ShopDto, ShopInput, toShopDto } from './shop.dto';
import { plainToInstance, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RoyaltyEarnedDto {
  @IsNumber()
  fee: number;

  @ApiProperty({ type: ShopDto })
  @Type(() => ShopDto)
  shop: ShopDto;
}

export type RoyaltyEarnedInput = { fee: number } & { shop: ShopInput };

export function toRoyaltyEarnedDto(input: RoyaltyEarnedInput) {
  const { fee, shop } = input;

  const plainRoyaltyEarnedDto: RoyaltyEarnedDto = {
    fee: input.fee,
    shop: toShopDto(shop),
  };

  return plainToInstance(RoyaltyEarnedDto, plainRoyaltyEarnedDto);
}

export function toRoyaltyEarnedDtoArray(inputs: RoyaltyEarnedInput[]) {
  return inputs.map(toRoyaltyEarnedDto);
}
