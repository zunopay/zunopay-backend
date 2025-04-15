type SphereKycStatus =
  | 'incomplete'
  | 'pending'
  | 'additionalReviewRequired'
  | 'approved'
  | 'rejected';
type SphereCustomerType = 'individual' | 'business';

export interface SphereCustomer {
  id: string;
  thirdParty: boolean | null;
  thirdPartyMessage: string | null;
  type: SphereCustomerType;
  kyc: SphereKycStatus;
  tos: 'incomplete' | 'pending' | 'approved';
  msa: 'incomplete' | 'pending' | 'approved' | 'declined' | 'voided';
  euAccountTos: 'incomplete' | 'pending' | 'approved';
  operatingResidency: 'incomplete' | 'approved' | 'rejected';
  isProhibitedBusinessType: boolean;
  website: string;
  requirements: string[];
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    postalCode: string | null;
    state: string | null;
    country: string | null;
  };
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  mock: boolean;
  wallets: string[];
  bankAccounts: string[];
  achPullUserIntentId: string | null;
  created: string;
  updated: string;
}

export type SphereFetchCustomerResponseData = {
  customer: SphereCustomer;
};

type SphereTransferStatus =
  | 'pending'
  | 'funded'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded';
type SphereCurrency = 'usd' | 'eur';
type SphereChainNetwork = 'sol';

type SphereBankStatus = 'pending' | 'active' | 'inactive' | 'invalid';
type SphereBeneficiary = {
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
};

export type SphereWalletOwnerType =
  | 'merchant'
  | 'customer'
  | 'Application'
  | 'bridge';
export interface SphereWalletAccount {
  id: string;
  address: string;
  network: SphereChainNetwork;
  primary: boolean;
  feePayer: boolean;
  owner: SphereWalletOwnerType;
  signed: boolean;
  mock: boolean;
  customer: string;
  created: string;
  updated: string;
  deleted: null;
}

interface SphereEurAccount {
  bankName: string;
  accountHolderName: string;
  accountName: string;
  bic: string;
  iban: string;
  country: string;
}

export interface SphereBankAccount {
  id: string;
  status: SphereBankStatus;
  customer: string;
  currency: SphereCurrency;
  accountDetails: SphereEurAccount;
  lookupKey: string;
  beneficiaryAddress: SphereBeneficiary;
  updated: string;
  created: string;
  deleted: null;
}

export interface SphereTransfer {
  id: string;
  type: 'onRamp' | 'offRamp';
  status: SphereTransferStatus;
  amount: string;
  source: {
    id: string;
    currency: SphereCurrency;
    network: string;
  };
  funding: {
    id: string;
    currency: SphereCurrency;
    network: string;
  };
  destination: {
    id: string;
    currency: SphereCurrency;
    network: string;
  };
  instructions: {
    memo: string;
    human: string;
    resource: SphereBankAccount | SphereWalletAccount;
  };
  customer: string;
  created: string;
  updated: string;
}

export type SphereTransferResponseData = {
  transfer: SphereTransfer;
};
