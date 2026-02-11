import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '../config.js';
import { logger } from './logger.js';
import { ChainReadError } from '../errors.js';

let connection: Connection | null = null;

export function get_connection(): Connection {
  if (connection !== null) {
    return connection;
  }

  try {
    connection = new Connection(config.SOLANA_RPC_URL, { commitment: 'confirmed' });
    logger.info({ rpc: config.SOLANA_RPC_URL }, 'Solana connection established');
    return connection;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new ChainReadError('connection', message);
  }
}

export function validate_public_key(address: string): PublicKey {
  try {
    return new PublicKey(address);
  } catch {
    throw new ChainReadError(address, 'Invalid Solana public key');
  }
}
