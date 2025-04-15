import { Cluster, Connection } from '@solana/web3.js';
import axios from 'axios';
import { CONFIG } from 'src/config/config';
import { BASE_SPHERE_URL } from 'src/constants';

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
