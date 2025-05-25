import { ComputeBudgetProgram } from '@solana/web3.js';

export const BASE_SPHERE_URL = 'https://api.spherepay.co';

export const USERNAME_MIN_SIZE = 3;
export const USERNAME_MAX_SIZE = 20;

export const USERNAME_REGEX = new RegExp(/^[a-zA-Z0-9_čćžšđČĆŽŠĐ]+$/);
export const USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const FEE_DESTINATION = '7SMfVRrJw75vPzHCQ3ckUCT9igMRre8VHmodTbaVv4R';
export const USDC_DECIMALS = 6;
export const FEE_USDC = 1200;
export const BUYER_DISCOUNT_FEE_BASIS_POINTS = 150;
export const PLATFORM_FEE_BASIS_POINTS = 50;
export const REFERRAL_FEE_BASIS_POINTS = 100;

export const TOKEN_ACCOUNT_FEE_USDC = 500000;

//QR Constants
export const UPI_VPA_PREFIX = 'upi://pay?';

// Guard Constants
export const JWT_LABEL = 'JWT-user';

// Instructions
export const MIN_COMPUTE_PRICE = 100_000;
export const MIN_COMPUTE_PRICE_IX = ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: MIN_COMPUTE_PRICE,
});

// Reward Points
export const EARLY_USER_POINTS = 3;
export const USER_REFERRAL_POINTS = 5;
export const SHOP_ONBOARDING_POINTS = 20;
export const MAX_SHOPPING_POINTS = 10;
