// src/rpc.js
import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

export const DEFAULT_RPC_ENDPOINTS = [
  process.env.SOLANA_RPC_URL,
  'https://api.mainnet-beta.solana.com',
  'https://solana-rpc.publicnode.com'
].filter(Boolean);

/**
 * Creates a Connection instance with the specified or default RPC endpoint.
 */
export function createConnection(customRpc = null) {
  const endpoint = customRpc || process.env.SOLANA_RPC_URL || DEFAULT_RPC_ENDPOINTS[0];
  return new Connection(endpoint, {
    commitment: 'confirmed'
  });
}

/**
 * Executes an RPC call with automatic retries and exponential backoff for rate limits (429) and network blips.
 */
export async function withRpcRetry(fn, maxRetries = 5, baseDelayMs = 1000) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const errMsg = err?.message || String(err);
      const statusCode = err?.context?.statusCode;
      const isRateLimit = statusCode === 429 ||
        errMsg.includes('429') ||
        errMsg.toLowerCase().includes('rate limit') ||
        errMsg.toLowerCase().includes('too many requests') ||
        errMsg.includes('ECONNRESET') ||
        errMsg.includes('fetch failed');

      if (attempt >= maxRetries || !isRateLimit) {
        throw err;
      }

      // Check for retry-after header if provided by RPC
      let delay = baseDelayMs * Math.pow(1.5, attempt - 1);
      const retryAfter = err?.context?.headers?.get ? err.context.headers.get('retry-after') : null;
      if (retryAfter) {
        const parsedSec = parseInt(retryAfter, 10);
        if (!isNaN(parsedSec)) {
          delay = Math.max(delay, (parsedSec + 1) * 1000);
        }
      }

      await new Promise(res => setTimeout(res, delay));
    }
  }
}
