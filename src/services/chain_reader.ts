import { get_connection, validate_public_key } from '../lib/solana.js';
import { logger } from '../lib/logger.js';
import { ChainReadError } from '../errors.js';
import type { BlockData, TransactionSummary, ChainDataInput } from '../types.js';

export async function read_block(slot: number): Promise<BlockData> {
  const connection = get_connection();
  try {
    const block = await connection.getBlock(slot, {
      maxSupportedTransactionVersion: 0,
      transactionDetails: 'none',
    });

    if (block === null) {
      throw new ChainReadError(`block:${slot}`, 'Block not found');
    }

    return {
      slot,
      blockhash: block.blockhash,
      parent_slot: block.parentSlot,
      transaction_count: block.transactions?.length ?? 0,
      timestamp: block.blockTime,
    };
  } catch (err) {
    if (err instanceof ChainReadError) throw err;
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new ChainReadError(`block:${slot}`, message);
  }
}

export async function read_block_range(start: number, end: number): Promise<BlockData[]> {
  const blocks: BlockData[] = [];
  const batch_size = 10;

  for (let slot = start; slot <= end; slot += batch_size) {
    const batch_end = Math.min(slot + batch_size - 1, end);
    const promises: Promise<BlockData | null>[] = [];

    for (let s = slot; s <= batch_end; s++) {
      promises.push(
        read_block(s).catch((err) => {
          logger.debug({ slot: s, err: err instanceof Error ? err.message : 'Unknown' }, 'Skipping block');
          return null;
        }),
      );
    }

    const results = await Promise.all(promises);
    for (const result of results) {
      if (result !== null) {
        blocks.push(result);
      }
    }
  }

  return blocks;
}

export async function read_wallet_transactions(
  address: string,
  limit: number,
): Promise<TransactionSummary[]> {
  const connection = get_connection();
  const pubkey = validate_public_key(address);

  try {
    const signatures = await connection.getSignaturesForAddress(pubkey, { limit });
    const summaries: TransactionSummary[] = [];

    for (const sig of signatures) {
      summaries.push({
        signature: sig.signature,
        slot: sig.slot,
        fee: 0,
        accounts: [],
        success: sig.err === null,
      });
    }

    return summaries;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new ChainReadError(`wallet:${address}`, message);
  }
}

export async function read_chain_data(input: ChainDataInput): Promise<{
  blocks: BlockData[];
  transactions: TransactionSummary[];
}> {
  let blocks: BlockData[] = [];
  let transactions: TransactionSummary[] = [];

  if (input.block_range !== undefined) {
    blocks = await read_block_range(input.block_range.start, input.block_range.end);
  }

  if (input.wallet_address !== undefined) {
    transactions = await read_wallet_transactions(input.wallet_address, 50);
  }

  if (blocks.length === 0 && transactions.length === 0) {
    const connection = get_connection();
    const current_slot = await connection.getSlot();
    blocks = await read_block_range(current_slot - 5, current_slot);
  }

  return { blocks, transactions };
}
