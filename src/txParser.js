// src/txParser.js

/**
 * Format a timestamp into a standard readable date string
 */
export function formatDateTime(timestampMs) {
  if (!timestampMs) return 'N/A';
  const d = new Date(timestampMs);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Basic parse of a signature item
 */
export function parseSignatureItem(sig) {
  const blockTime = sig.blockTime ? Number(sig.blockTime) : null;
  const timestampMs = blockTime ? blockTime * 1000 : null;
  const success = sig.err === null;

  return {
    signature: sig.signature,
    address_by: null,
    status: success ? 'SUCCESS' : 'FAILED',
    success,
    timeFormatted: formatDateTime(timestampMs),
    blockTime,
    slot: sig.slot ? Number(sig.slot) : null
  };
}

/**
 * Extract signer / address_by from a parsed Solana transaction
 */
export function parseDetailedTransaction(tx) {
  if (!tx) return null;

  let signer = 'Unknown';
  if (tx.transaction?.message?.accountKeys) {
    const signerAccount = tx.transaction.message.accountKeys.find(a => a.signer);
    if (signerAccount) {
      signer = signerAccount.pubkey?.toString() || signerAccount.toString();
    }
  }

  const success = tx.meta?.err === null;
  const blockTime = tx.blockTime ? Number(tx.blockTime) : null;
  const timestampMs = blockTime ? blockTime * 1000 : null;

  return {
    address_by: signer,
    signer,
    status: success ? 'SUCCESS' : 'FAILED',
    success,
    timeFormatted: formatDateTime(timestampMs)
  };
}
