import { plainToInstance } from 'class-transformer';
import { IsEnum, IsString } from 'class-validator';
import { Currency } from 'src/types/payment';

export class WalletBalanceDto {
  @IsString()
  balance: string;

  @IsEnum(Currency)
  currency: Currency;
}

export type WalletBalanceInput = { balance: string; currency: Currency };

export function toWalletBalanceDto(input: WalletBalanceInput) {
  const plainWalletBalanceDto: WalletBalanceDto = {
    balance: input.balance,
    currency: input.currency,
  };

  const walletBalanceDto = plainToInstance(
    WalletBalanceDto,
    plainWalletBalanceDto,
  );
  return walletBalanceDto;
}
