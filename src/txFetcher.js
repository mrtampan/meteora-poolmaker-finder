// src/txFetcher.js
import { PublicKey } from '@solana/web3.js';
import { withRpcRetry } from './rpc.js';
import { parseSignatureItem, parseDetailedTransaction } from './txParser.js';

/**
 * Fetch the first transaction of a Solana pool address.
 */
export async function fetchFirstTransaction(connection, poolAddress) {
  const rpcUrl = connection.rpcEndpoint;
  let genesisSig = null;
  let basicItem = null;

  // 1. Try enhanced RPC method getTransactionsForAddress with sortOrder: 'asc' (Alchemy, Helius, Triton)
  try {
    const res = await withRpcRetry(async () => {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransactionsForAddress',
          params: [poolAddress, { sortOrder: 'asc', limit: 1 }]
        })
      });
      const json = await response.json();
      if (json.error) throw new Error(json.error.message);
      return json.result;
    }, 3, 500);

    if (res?.data && res.data.length > 0) {
      basicItem = parseSignatureItem(res.data[0]);
      genesisSig = basicItem.signature;
    }
  } catch {
    // If not supported by RPC, fall back to backward scan
  }

  // 2. Fallback backward scan if enhanced method not available
  if (!genesisSig) {
    const pubkey = new PublicKey(poolAddress);
    let before = undefined;
    let lastBatch = [];

    for (let i = 0; i < 50; i++) {
      const batch = await withRpcRetry(() =>
        connection.getSignaturesForAddress(pubkey, { limit: 1000, before })
      );
      if (!batch || batch.length === 0) break;
      lastBatch = batch;
      if (batch.length < 1000) break;
      before = batch[batch.length - 1].signature;
      await new Promise(r => setTimeout(r, 100));
    }

    if (lastBatch.length > 0) {
      // The last element of the earliest batch is genesis
      basicItem = parseSignatureItem(lastBatch[lastBatch.length - 1]);
      genesisSig = basicItem.signature;
    }
  }

  if (!genesisSig) {
    return null;
  }

  // Fetch parsed transaction to get signer / address_by
  try {
    const rawTx = await withRpcRetry(() =>
      connection.getParsedTransaction(genesisSig, {
        maxSupportedTransactionVersion: 1
      })
    );

    const detailed = parseDetailedTransaction(rawTx);
    return {
      ...basicItem,
      ...(detailed || {})
    };
  } catch {
    return basicItem;
  }
}
