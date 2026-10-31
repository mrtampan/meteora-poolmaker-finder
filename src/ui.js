// src/ui.js
import Table from 'cli-table3';
import pc from 'picocolors';

/**
 * Print welcome banner for interactive command mode
 */
export function printWelcomeBanner() {
  console.log('\n' + pc.bold(pc.cyan('='.repeat(72))));
  console.log(pc.bold(pc.cyan('  🚀 SOLANA POOL FIRST TRANSACTION EXPLORER')));
  console.log(pc.bold(pc.cyan('='.repeat(72))));
  console.log(pc.white('  Ketik command untuk memulai:'));
  console.log(`    ${pc.bold(pc.green('/scan <pooladdress>'))}  ${pc.white('- Scan transaksi pertama (genesis) & pembuat pool')}`);
  console.log(`    ${pc.bold(pc.blue('/help'))}                ${pc.dim('- Tampilkan panduan command')}`);
  console.log(`    ${pc.bold(pc.magenta('/clear'))}               ${pc.dim('- Bersihkan layar terminal')}`);
  console.log(`    ${pc.bold(pc.red('/exit'))}                ${pc.dim('- Keluar dari program')}`);
  console.log(pc.cyan('-'.repeat(72)) + '\n');
}

/**
 * Print command guide / help
 */
export function printHelp() {
  console.log('\n' + pc.bold(pc.cyan('Panduan Command:')));
  console.log(`  ${pc.bold(pc.green('/scan <pooladdress>'))}`);
  console.log(`      Memindai alamat pool Solana untuk mencari transaksi pertama & maker.`);
  console.log(`      Hasil scan otomatis tersimpan ke ${pc.bold('state-data.json')}.`);
  console.log(`      Contoh: ${pc.dim('/scan xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a')}\n`);
  console.log(`  ${pc.bold(pc.magenta('/clear'))}`);
  console.log(`      Membersihkan tampilan terminal.\n`);
  console.log(`  ${pc.bold(pc.red('/exit'))} atau ${pc.bold(pc.red('/quit'))}`);
  console.log(`      Keluar dari program.\n`);
}

/**
 * Print decorative pool header
 */
export function printPoolHeader(poolInfo, rpcEndpoint) {
  console.log('\n' + pc.bold(pc.cyan('='.repeat(72))));
  console.log(pc.bold(pc.cyan(`  SOLANA POOL FIRST TRANSACTION EXPLORER`)));
  console.log(pc.bold(pc.cyan('='.repeat(72))));

  console.log(`  ${pc.bold('Pool Address :')} ${pc.yellow(poolInfo.address)}`);
  console.log(`  ${pc.bold('Pair / Token :')} ${pc.green(pc.bold(poolInfo.pairName))} (${pc.magenta(poolInfo.dex)})`);
  console.log(`  ${pc.bold('Explorer URL :')} ${pc.blue(poolInfo.url)}`);
  console.log(`  ${pc.bold('RPC Endpoint :')} ${pc.dim(rpcEndpoint)}`);
  console.log(pc.cyan('-'.repeat(72)) + '\n');
}

/**
 * Render clean result table containing:
 * - Signature
 * - Address By
 * - Pair / Token
 * - Status
 * - Time Formatted
 */
export function renderTable(transactions, poolInfo = null) {
  const table = new Table({
    head: [
      pc.bold(pc.white('#')),
      pc.bold(pc.white('Signature')),
      pc.bold(pc.white('Address By')),
      pc.bold(pc.white('Pair / Token')),
      pc.bold(pc.white('Status')),
      pc.bold(pc.white('Time Formatted'))
    ],
    colWidths: [5, 46, 46, 22, 12, 20],
    style: {
      head: [],
      border: ['gray']
    }
  });

  const list = Array.isArray(transactions) ? transactions : [transactions];
  const defaultPair = poolInfo?.pairName || 'Unknown';
  const defaultToken = poolInfo?.baseToken?.name || poolInfo?.baseToken?.symbol || '';

  list.forEach((tx, i) => {
    const num = pc.dim(String(i + 1));
    const sig = pc.cyan(tx.signature);
    const addr = pc.yellow(tx.address_by || tx.signer || 'Unknown');
    const pair = pc.green(tx.pair_name || defaultPair);
    const token = (tx.token_name || defaultToken) ? pc.dim(` (${tx.token_name || defaultToken})`) : '';
    const status = (tx.status === 'SUCCESS' || tx.success) ? pc.green('✓ SUCCESS') : pc.red('✗ FAILED');
    const time = pc.white(tx.timeFormatted || tx.timeformatted || 'N/A');
    table.push([num, sig, addr, `${pair}${token}`, status, time]);
  });

  return table.toString();
}
