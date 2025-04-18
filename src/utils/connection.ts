import {
  Cluster,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import axios from 'axios';
import { CONFIG } from 'src/config/config';
import { BASE_SPHERE_URL } from 'src/constants';
import * as AES from 'crypto-js/aes';
import * as Utf8 from 'crypto-js/enc-utf8';

export function clusterHeliusApiUrl(
  apiKey: string,
  cluster: Cluster = 'devnet',
) {
  switch (cluster) {
    case 'devnet':
      return `http://devnet.helius-rpc.com/?api-key=${apiKey}`;
    case 'mainnet-beta':
      return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
    default:
      return '';
  }
}

/**
 * Creates and returns a Solana connection based on the provided or default endpoint.
 * @param {string} [customEndpoint] - Optional custom endpoint URL.
 * @returns {Connection} The Solana connection.
 */
export function getConnection(customEndpoint?: string) {
  const endpoint =
    customEndpoint ||
    clusterHeliusApiUrl(
      process.env.HELIUS_API_KEY,
      process.env.SOLANA_CLUSTER as Cluster,
    );

  const connection = new Connection(endpoint, 'confirmed');
  return connection;
}

export function getSphereApiClient() {
  const client = axios.create({
    url: `${BASE_SPHERE_URL}`,
    headers: {
      Authorization: `Bearer ${CONFIG.spherePayAuth.token}`,
      'Content-Type': 'application/json',
    },
  });

  return client;
}

/**
 * Signs a Solana/web3.js transaction with the identity (treasury) signer.
 * @param {Transaction | VersionedTransaction} transaction - The transaction to sign.
 * @returns {Transaction | VersionedTransaction} The signed transaction.
 */
export function getIdentitySignature<
  T extends Transaction | VersionedTransaction,
>(transaction: T): T {
  const signer = getTreasuryKeypair();
  if ('partialSign' in transaction) {
    transaction.partialSign(signer);
  } else {
    // Handle VersionedTransaction differently
    transaction.sign([signer]);
  }
  return transaction;
}

/**
 * Retrieves the treasury keypair from encrypted environment variables.
 * @returns {Keypair} The treasury keypair.
 */
const getTreasuryKeypair = (): Keypair => {
  const treasuryWallet = AES.decrypt(
    process.env.TREASURY_PRIVATE_KEY,
    process.env.TREASURY_SECRET,
  );
  const treasuryKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(treasuryWallet.toString(Utf8))),
  );
  return treasuryKeypair;
};

/**
 * Returns the public key of the treasury.
 * @returns {PublicKey} The public key of the treasury.
 */
export const getTreasuryPublicKey = (): PublicKey => {
  return getTreasuryKeypair().publicKey;
};
