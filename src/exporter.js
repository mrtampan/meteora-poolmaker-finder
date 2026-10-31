// src/exporter.js
import fs from 'fs';
import path from 'path';

/**
 * Format a transaction to the exact required fields:
 * - signature
 * - address_by
 * - pair_name
 * - token_name
 * - status
 * - timeformatted
 */
export function formatResultItem(tx, poolInfo = null) {
  return {
    signature: tx.signature || '',
    address_by: tx.address_by || tx.signer || 'Unknown',
    pair_name: poolInfo?.pairName || tx.pair_name || 'Unknown',
    token_name: poolInfo?.baseToken?.name || poolInfo?.baseToken?.symbol || tx.token_name || 'Unknown',
    status: (tx.status === 'SUCCESS' || tx.success) ? 'SUCCESS' : 'FAILED',
    timeformatted: tx.timeFormatted || tx.timeformatted || ''
  };
}

/**
 * Save result data to state-data.json (accumulates into array, updates if signature exists).
 */
export function saveStateData(data, filePath = 'state-data.json') {
  const resolved = path.resolve(process.cwd(), filePath);
  let list = [];

  if (fs.existsSync(resolved)) {
    try {
      const content = fs.readFileSync(resolved, 'utf-8').trim();
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          list = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
          list = [parsed];
        }
      }
    } catch {
      list = [];
    }
  }

  const items = Array.isArray(data) ? data : [data];
  for (const item of items) {
    const existingIndex = list.findIndex(e => e.signature === item.signature);
    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.push(item);
    }
  }

  fs.writeFileSync(resolved, JSON.stringify(list, null, 2), 'utf-8');
  return resolved;
}
