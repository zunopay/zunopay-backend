import { BadRequestException } from '@nestjs/common';
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import { MIN_COMPUTE_PRICE, USDC_ADDRESS, USDC_DECIMALS } from '../constants';
import { Currency } from '../types/payment';

export function getCurrencyValue(key: string): Currency {
  const currency = key.replace(/\d+$/, '');

  if (!(currency in Currency)) {
    throw new BadRequestException('Invalid currency code.');
  }
  return Currency[currency as keyof typeof Currency];
}

export async function constructDigitalTransferTransaction(
  connection: Connection,
  sender: string,
  receiver: string,
  amount: number,
) {
  const mint = new PublicKey(USDC_ADDRESS);
  const sourceOwner = new PublicKey(sender);
  const destinationOwner = new PublicKey(receiver);

  const source = await getAssociatedTokenAddress(mint, sourceOwner, false);
  const destination = await getAssociatedTokenAddress(
    mint,
    destinationOwner,
    false,
  );

  const transferInstruction = createTransferCheckedInstruction(
    source,
    mint,
    destination,
    sourceOwner,
    amount,
    USDC_DECIMALS,
  );
  const computeBudgetInstruction = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: MIN_COMPUTE_PRICE,
  });
  const latestBlockhash = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    ...latestBlockhash,
    feePayer: sourceOwner,
  })
    .add(computeBudgetInstruction)
    .add(transferInstruction);

  const serializedTransaction = transaction
    .serialize({
      requireAllSignatures: false,
    })
    .toString('base64');

  return serializedTransaction;
}

export async function getUSDCAccount(owner: PublicKey) {
  const mint = new PublicKey(USDC_ADDRESS);

  const tokenAccount = await getAssociatedTokenAddress(mint, owner);
  return tokenAccount;
}

export function getUSDCUiAmount(amount: number) {
  const uiAmount = (amount / USDC_DECIMALS).toFixed(3);
  return uiAmount;
}

export function isSolanaAddress(value: unknown): boolean {
  try {
    return typeof value === 'string' && PublicKey.isOnCurve(value);
  } catch {
    return false;
  }
}
