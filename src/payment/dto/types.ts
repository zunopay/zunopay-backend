import { Currency } from '../../types/payment';

export enum QrProvider {
  UPI,
  PIX,
  SEPA,
}

export interface ReceiverQrDetails {
  name: string;
  vpa: string; // Iban or upi id (depends on qr provider)
  currency: Currency;
}
export interface ReceiverBankingDetail extends ReceiverQrDetails {
  walletAddress: string;
}
