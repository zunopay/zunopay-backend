import { BadRequestException } from '@nestjs/common';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { USDC_ADDRESS, USDC_DECIMALS } from '../constants';
import { Currency } from '../types/payment';
import { SupportedRegion } from '@prisma/client';

export function getCurrencyValue(key: string): Currency {
  const currency = key.replace(/\d+$/, '');

  if (!(currency in Currency)) {
    throw new BadRequestException('Invalid currency code.');
  }
  return Currency[currency as keyof typeof Currency];
}

export async function getUSDCAccount(owner: PublicKey) {
  const mint = new PublicKey(USDC_ADDRESS);

  const tokenAccount = await getAssociatedTokenAddress(mint, owner);
  return tokenAccount;
}

export function getUSDCUiAmount(amount: number) {
  return ((amount ?? 0) / Math.pow(10, USDC_DECIMALS)).toFixed(3);
}

export function isSolanaAddress(value: unknown): boolean {
  try {
    return typeof value === 'string' && PublicKey.isOnCurve(value);
  } catch {
    return false;
  }
}

//TODO: Change this after conversion api
export const RegionToCurrency = {
  [SupportedRegion.IN]: Currency.USD,
  [SupportedRegion.EU]: Currency.USD,
  [SupportedRegion.BR]: Currency.USD,
  [SupportedRegion.SG]: Currency.USD,
};

export enum VpaType {
  Address = 'Address',
  PaymentInterface = 'PaymentInterface',
}
