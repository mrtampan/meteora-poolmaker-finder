// src/prompt.js
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { PublicKey } from '@solana/web3.js';
import pc from 'picocolors';
import { printWelcomeBanner, printHelp } from './ui.js';

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
 * Starts interactive CLI command loop.
 * Users can type /scan <pooladdress>, /help, /clear, /exit
 */
export async function startInteractiveCli(onScan) {
  printWelcomeBanner();

  const rl = readline.createInterface({ input, output });

  const sigintHandler = () => {
    console.log(pc.cyan('\n\nThank you, goodbye! 👋\n'));
    process.exit(0);
  };
  process.on('SIGINT', sigintHandler);

  try {
    while (true) {
      let answer;
      try {
        answer = await rl.question(pc.bold(pc.cyan('solana-pool-tx > ')));
      } catch {
        // Stream closed or interrupted
        break;
      }

      if (answer === null || answer === undefined) break;

      const line = answer.trim();
      if (!line) continue;

      const lower = line.toLowerCase();

      // Exit commands
      if (lower === '/exit' || lower === '/quit' || lower === 'exit' || lower === 'quit') {
        console.log(pc.cyan('\nThank you, goodbye! 👋\n'));
        break;
      }

      // Help command
      if (lower === '/help' || lower === 'help') {
        printHelp();
        continue;
      }

      // Clear terminal
      if (lower === '/clear' || lower === 'clear') {
        console.clear();
        printWelcomeBanner();
        continue;
      }

      // /scan command
      if (line.startsWith('/scan')) {
        const target = line.replace(/^\/scan\s*/i, '').trim();

        // Warning if pooladdress is empty
        if (!target) {
          console.log(pc.yellow('\n⚠️  Warning: Pool address is required!'));
          console.log(pc.white('   Format: ') + pc.bold(pc.green('/scan <pooladdress>')));
          console.log(pc.dim('   Example: ') + pc.cyan('/scan xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a\n'));
          continue;
        }

        if (!isValidSolanaAddress(target)) {
          console.log(pc.red(`\n❌ Error: Address '${target}' is not a valid Solana address!`));
          console.log(pc.dim('   Solana address must be Base58 encoded (32-44 characters).\n'));
          continue;
        }

        try {
          await onScan(target);
        } catch (err) {
          console.error(pc.red(`\n❌ Error while scanning: ${err.message}\n`));
        }
        continue;
      }

      // Direct address pasted without /scan prefix
      if (isValidSolanaAddress(line)) {
        console.log(pc.blue(`\nℹ️  Detected Solana address without /scan prefix, starting scan...`));
        try {
          await onScan(line);
        } catch (err) {
          console.error(pc.red(`\n❌ Error while scanning: ${err.message}\n`));
        }
        continue;
      }

      // Unrecognized input
      console.log(pc.red(`\n❌ Invalid command: "${line}"`));
      console.log(pc.yellow(`   Type `) + pc.bold(pc.green('/scan <pooladdress>')) + pc.yellow(` to scan a pool.`));
      console.log(pc.dim(`   Type /help to view available commands.\n`));
    }
  } finally {
    process.removeListener('SIGINT', sigintHandler);
    rl.close();
  }
}

/**
 * Resolves a pool address either from CLI input or returns null.
 */
export async function resolvePoolAddress(providedAddress) {
  if (providedAddress && typeof providedAddress === 'string') {
    const trimmed = providedAddress.trim();
    if (isValidSolanaAddress(trimmed)) {
      return trimmed;
    }
  }
  return null;
}
