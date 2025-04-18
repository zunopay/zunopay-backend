import { ComputeBudgetProgram } from '@solana/web3.js';

export const BASE_SPHERE_URL = 'https://api.spherepay.co';

export const USERNAME_MIN_SIZE = 3;
export const USERNAME_MAX_SIZE = 20;

export const USERNAME_REGEX = new RegExp(/^[a-zA-Z0-9_čćžšđČĆŽŠĐ]+$/);
export const USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDC_DECIMALS = 6;

//QR Constants
export const UPI_VPA_PREFIX = 'upi://pay?';

// Guard Constants
export const JWT_LABEL = 'JWT-user';

// Instructions
export const MIN_COMPUTE_PRICE = 600_000;
export const MIN_COMPUTE_PRICE_IX = ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: MIN_COMPUTE_PRICE,
});
