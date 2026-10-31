// src/prompt.js
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { PublicKey } from '@solana/web3.js';
import pc from 'picocolors';

export const DEFAULT_POOL = 'xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a';

/**
 * Validates whether a string is a valid Solana Base58 public key.
 */
export function isValidSolanaAddress(address) {
  if (!address || typeof address !== 'string') return false;
  try {
    new PublicKey(address.trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves a pool address either from CLI input or via an interactive manual prompt.
 */
export async function resolvePoolAddress(providedAddress) {
  // If address was supplied via argument or flag, validate and use it directly
  if (providedAddress && typeof providedAddress === 'string') {
    const trimmed = providedAddress.trim();
    if (isValidSolanaAddress(trimmed)) {
      return trimmed;
    }
    console.warn(pc.yellow(`\n⚠️  Alamat '${providedAddress}' tidak valid sebagai Solana address.`));
    console.log(pc.dim(`   Beralih ke input manual...\n`));
  }

  const isTty = process.stdin.isTTY;
  const rl = readline.createInterface({ input, output });

  try {
    if (isTty) {
      console.log('\n' + pc.bold(pc.cyan('='.repeat(70))));
      console.log(pc.bold(pc.cyan('  INPUT MANUAL POOL ADDRESS SOLANA')));
      console.log(pc.bold(pc.cyan('='.repeat(70))));
      console.log(pc.white('  Silakan ketik atau paste Pool Address yang ingin ditampilkan:'));
      console.log(pc.dim(`  (Tekan [Enter] untuk default: ${DEFAULT_POOL})`));
    }

    while (true) {
      const promptText = isTty ? pc.bold(pc.yellow('  Pool Address > ')) : '';
      const answer = await rl.question(promptText);
      const trimmed = answer ? answer.trim() : '';

      if (!trimmed) {
        if (isTty) {
          console.log(pc.green(`  ✓ Menggunakan default pool: ${DEFAULT_POOL}\n`));
        }
        return DEFAULT_POOL;
      }

      if (isValidSolanaAddress(trimmed)) {
        if (isTty) {
          console.log(pc.green(`  ✓ Pool Address valid: ${trimmed}\n`));
        }
        return trimmed;
      }

      console.log(pc.red(`  ❌ Error: Alamat '${trimmed}' tidak valid! Alamat Solana harus berupa Base58 (32-44 karakter).`));
      if (!isTty) {
        return DEFAULT_POOL;
      }
      console.log(pc.dim(`     Silakan coba lagi atau tekan Enter untuk default.`));
    }
  } finally {
    rl.close();
  }
}
