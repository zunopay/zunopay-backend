import { BadRequestException } from '@nestjs/common';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  FEE_DESTINATION,
  FEE_USDC,
  MIN_COMPUTE_PRICE,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from '../constants';
import { Currency } from '../types/payment';
import { getIdentitySignature, getTreasuryPublicKey } from './connection';
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
  const uiAmount = (amount / Math.pow(10, USDC_DECIMALS)).toFixed(3);
  return uiAmount;
}

export function isSolanaAddress(value: unknown): boolean {
  try {
    return typeof value === 'string' && PublicKey.isOnCurve(value);
  } catch {
    return false;
  }
}

export const RegionToCurrency = {
  [SupportedRegion.IN]: Currency.INR,
  [SupportedRegion.EU]: Currency.EUR,
  [SupportedRegion.BR]: Currency.USD,
  [SupportedRegion.SG]: Currency.USD,
};
