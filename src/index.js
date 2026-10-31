#!/usr/bin/env node

// src/index.js
import { Command } from 'commander';
import ora from 'ora';
import pc from 'picocolors';
import { createConnection } from './rpc.js';
import { getPoolInfo } from './pool.js';
import { fetchFirstTransaction } from './txFetcher.js';
import { printPoolHeader, renderTable } from './ui.js';
import { formatResultItem, saveStateData } from './exporter.js';
import { startInteractiveCli, isValidSolanaAddress } from './prompt.js';

/**
 * Executes a scan for the given pool address:
 * - Fetches pool metadata
 * - Fetches first genesis transaction
 * - Displays formatted terminal table
 * - Saves result to state-data.json
 */
export async function executeScan(poolAddress, options = {}) {
  const targetAddress = (poolAddress || '').trim();

  if (!isValidSolanaAddress(targetAddress)) {
    console.log(pc.red(`\n❌ Error: Address '${targetAddress}' is not a valid Solana address (Base58 32-44 characters).\n`));
    return false;
  }

  const connection = createConnection(options.rpc);

  // 1. Fetch pool metadata
  const spinner = ora(`Connecting to Solana RPC: ${targetAddress}...`).start();
  let poolInfo;
  try {
    poolInfo = await getPoolInfo(connection, targetAddress);
  } catch (err) {
    spinner.fail(`Failed to fetch pool data: ${err.message}`);
    return false;
  }

  // 2. Fetch first transaction (genesis)
  spinner.text = 'Fetching initial transaction (genesis / pool creation)...';
  let firstTx;
  try {
    firstTx = await fetchFirstTransaction(connection, targetAddress);
  } catch (err) {
    spinner.fail(`Failed to fetch initial transaction: ${err.message}`);
    return false;
  }

  if (!firstTx) {
    spinner.fail(`No transactions found for pool: ${targetAddress}`);
    return false;
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

  return true;
}

const program = new Command();

program
  .name('solana-pool-tx')
  .description('Solana Pool First Transaction Explorer - Get pool genesis & creator data and save to state-data.json')
  .version('1.0.0');

program
  .argument('[args...]', 'Pool address or command like /scan <pooladdress>')
  .option('-p, --pool <address>', 'Specify pool address via option')
  .option('-o, --output <file>', 'JSON output file path', 'state-data.json')
  .option('-r, --rpc <url>', 'Custom Solana RPC URL (Alchemy, Helius, QuickNode, etc.)')
  .action(async (args, options) => {
    let poolTarget = options.pool || null;

    if (!poolTarget && args && args.length > 0) {
      if (args[0] === '/scan') {
        poolTarget = args[1] || null;
        if (!poolTarget) {
          console.log(pc.yellow('\n⚠️  Warning: Pool address is required!'));
          console.log(pc.white('   Format: ') + pc.bold(pc.green('/scan <pooladdress>')));
          console.log(pc.dim('   Example: ') + pc.cyan('node src/index.js /scan xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a\n'));
          process.exit(1);
        }
      } else if (args[0].startsWith('/scan')) {
        const rest = args.join(' ').replace(/^\/scan\s*/i, '').trim();
        poolTarget = rest || null;
        if (!poolTarget) {
          console.log(pc.yellow('\n⚠️  Warning: Pool address is required!'));
          console.log(pc.white('   Format: ') + pc.bold(pc.green('/scan <pooladdress>')));
          console.log(pc.dim('   Example: ') + pc.cyan('node src/index.js /scan xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a\n'));
          process.exit(1);
        }
      } else {
        poolTarget = args[0];
      }
    }

    // If pool target is supplied via CLI args/flag, execute directly
    if (poolTarget) {
      const ok = await executeScan(poolTarget, options);
      process.exit(ok ? 0 : 1);
    }

    // Otherwise, start interactive command mode (default for npm start)
    await startInteractiveCli(async (target) => {
      await executeScan(target, options);
    });
  });

program.parse(process.argv);
