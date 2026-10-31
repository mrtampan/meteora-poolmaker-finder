// src/pool.js
import { PublicKey } from '@solana/web3.js';

// Known Solana Program IDs for popular DEXes
const KNOWN_PROGRAMS = {
  'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo': 'Meteora DLMM',
  'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB': 'Meteora Dynamic Pools',
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium Liquidity Pool V4',
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK': 'Raydium CLMM',
  'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C': 'Raydium CPMM',
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Orca Whirlpool',
  '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP': 'Orca Aquafarm',
  '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P': 'Pump.fun Bonding Curve',
  'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY': 'Phoenix DEX',
  'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX': 'OpenBook V1',
  'opnb2TXrmQBpcBt3txNkH3zLWBphLQBgdsUe5UPCHB4': 'OpenBook V2'
};

/**
 * Fetch information about a Solana Pool address.
 * First queries DexScreener for rich pair data, then falls back to on-chain account info.
 */
export async function getPoolInfo(connection, poolAddress) {
  let dexData = null;
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${poolAddress}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.pairs && data.pairs.length > 0) {
        dexData = data.pairs[0];
      }
    }
  } catch (e) {
    // DexScreener might be offline or rate-limiting; continue with fallback
  }

  // Query on-chain account info
  let accountInfo = null;
  try {
    accountInfo = await connection.getAccountInfo(new PublicKey(poolAddress));
  } catch (e) {
    // ignore
  }

  const ownerProgram = accountInfo ? accountInfo.owner.toString() : null;
  const programName = ownerProgram ? (KNOWN_PROGRAMS[ownerProgram] || `Unknown (${ownerProgram.slice(0, 8)}...)`) : 'Unknown';

  if (dexData) {
    return {
      address: poolAddress,
      dex: dexData.dexId ? dexData.dexId.toUpperCase() : programName,
      programName,
      ownerProgram,
      pairName: `${dexData.baseToken?.symbol || 'Unknown'} / ${dexData.quoteToken?.symbol || 'SOL'}`,
      baseToken: dexData.baseToken || null,
      quoteToken: dexData.quoteToken || null,
      priceUsd: dexData.priceUsd ? `$${parseFloat(dexData.priceUsd).toFixed(6)}` : 'N/A',
      priceNative: dexData.priceNative ? `${parseFloat(dexData.priceNative).toFixed(8)} SOL` : 'N/A',
      volume24h: dexData.volume?.h24 ? `$${Number(dexData.volume.h24).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : 'N/A',
      liquidityUsd: dexData.liquidity?.usd ? `$${Number(dexData.liquidity.usd).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : 'N/A',
      url: dexData.url || `https://solscan.io/account/${poolAddress}`
    };
  }

  return {
    address: poolAddress,
    dex: programName,
    programName,
    ownerProgram,
    pairName: 'Custom Pool',
    baseToken: null,
    quoteToken: null,
    priceUsd: 'N/A',
    priceNative: 'N/A',
    volume24h: 'N/A',
    liquidityUsd: 'N/A',
    url: `https://solscan.io/account/${poolAddress}`
  };
}

