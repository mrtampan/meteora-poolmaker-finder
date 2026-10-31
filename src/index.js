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
import { resolvePoolAddress } from './prompt.js';

const program = new Command();

program
  .name('solana-pool-tx')
  .description('Solana Pool First Transaction Explorer - Get pool genesis & creator data and save to state-data.json')
  .version('1.0.0');

program
  .argument('[poolAddress]', 'Solana pool address (jika kosong, akan diminta input manual)')
  .option('-p, --pool <address>', 'Tentukan pool address via opsi')
  .option('-o, --output <file>', 'Lokasi file penyimpanan JSON', 'state-data.json')
  .option('-r, --rpc <url>', 'URL Solana RPC custom (Alchemy, Helius, QuickNode, dll)')
  .action(async (poolArg, options) => {
    // 1. Resolve pool address (from argument, option, or interactive prompt)
    const poolAddress = await resolvePoolAddress(options.pool || poolArg);
    const connection = createConnection(options.rpc);

    // 2. Fetch pool metadata
    const spinner = ora(`Menghubungkan ke Solana RPC: ${poolAddress}...`).start();
    let poolInfo;
    try {
      poolInfo = await getPoolInfo(connection, poolAddress);
    } catch (err) {
      spinner.fail(`Gagal mengambil data pool: ${err.message}`);
      process.exit(1);
    }

    // 3. Fetch first transaction (genesis)
    spinner.text = 'Mengambil data transaksi pertama (genesis / initial pool transaction)...';
    let firstTx;
    try {
      firstTx = await fetchFirstTransaction(connection, poolAddress);
    } catch (err) {
      spinner.fail(`Gagal mengambil transaksi pertama: ${err.message}`);
      process.exit(1);
    }

    if (!firstTx) {
      spinner.fail(`Tidak ditemukan transaksi untuk pool: ${poolAddress}`);
      process.exit(1);
    }

    spinner.succeed('Berhasil memuat transaksi pertama pool.');

    // 4. Format result data (signature, address_by, pair_name, token_name, status, timeformatted)
    const resultItem = formatResultItem(firstTx, poolInfo);

    // 5. Render clean terminal table
    printPoolHeader(poolInfo, connection.rpcEndpoint);
    console.log(renderTable([resultItem], poolInfo));

    // 6. Save result data to state-data.json
    const outputFile = options.output || 'state-data.json';
    const savedPath = saveStateData(resultItem, outputFile);
    console.log(pc.green(`✓ Result data saved to `) + pc.bold(savedPath) + '\n');
  });

program.parse(process.argv);
