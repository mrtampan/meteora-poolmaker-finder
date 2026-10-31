// src/scanner.js
import ora from 'ora';
import pc from 'picocolors';
import { createConnection } from './rpc.js';
import { getPoolInfo } from './pool.js';
import { fetchFirstTransaction } from './txFetcher.js';
import { printPoolHeader, renderTable } from './ui.js';
import { formatResultItem, saveStateData } from './exporter.js';
import { isValidSolanaAddress } from './prompt.js';

/**
 * Broadcast helper that does not create circular dependency
 */
async function tryBroadcastToTelegram(resultItem, poolInfo) {
  if (process.env.TELEGRAM_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      const { TelegramBotClient } = await import('./telegram.js');
      const tg = new TelegramBotClient(process.env.TELEGRAM_TOKEN, {
        allowedChatId: process.env.TELEGRAM_CHAT_ID
      });
      await tg.broadcastResult(resultItem, poolInfo);
    } catch {
      // Non-blocking: fail quietly if telegram has issue
    }
  }
}

/**
 * Executes a scan for the given pool address:
 * - Fetches pool metadata
 * - Fetches first genesis transaction
 * - Displays formatted terminal table
 * - Saves result to state-data.json
 * - Broadcasts result to Telegram if configured
 */
export async function executeScan(poolAddress, options = {}) {
  const targetAddress = (poolAddress || '').trim();

  if (!isValidSolanaAddress(targetAddress)) {
    console.log(pc.red(`\n❌ Error: Address '${targetAddress}' is not a valid Solana address (Base58 32-44 characters).\n`));
    return null;
  }

  const connection = createConnection(options.rpc);

  // 1. Fetch pool metadata
  const spinner = ora(`Connecting to Solana RPC: ${targetAddress}...`).start();
  let poolInfo;
  try {
    poolInfo = await getPoolInfo(connection, targetAddress);
  } catch (err) {
    spinner.fail(`Failed to fetch pool data: ${err.message}`);
    return null;
  }

  // 2. Fetch first transaction (genesis)
  spinner.text = 'Fetching initial transaction (genesis / pool creation)...';
  let firstTx;
  try {
    firstTx = await fetchFirstTransaction(connection, targetAddress);
  } catch (err) {
    spinner.fail(`Failed to fetch initial transaction: ${err.message}`);
    return null;
  }

  if (!firstTx) {
    spinner.fail(`No transactions found for pool: ${targetAddress}`);
    return null;
  }

  spinner.succeed('Successfully loaded initial pool transaction.');

  // 3. Format result data
  const resultItem = formatResultItem(firstTx, poolInfo);

  // 4. Render clean terminal table
  printPoolHeader(poolInfo, connection.rpcEndpoint);
  console.log(renderTable([resultItem], poolInfo));

  // 5. Save result data to state-data.json
  const outputFile = options.output || 'state-data.json';
  const savedPath = saveStateData(resultItem, outputFile);
  console.log(pc.green(`✓ Result data saved to `) + pc.bold(savedPath) + '\n');

  // 6. Broadcast to Telegram if configured
  await tryBroadcastToTelegram(resultItem, poolInfo);

  return { resultItem, poolInfo };
}

