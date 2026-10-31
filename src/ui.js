// src/ui.js
import Table from 'cli-table3';
import pc from 'picocolors';

/**
 * Print welcome banner for interactive command mode
 */
export function printWelcomeBanner(botUsername = null) {
  console.log('\n' + pc.bold(pc.cyan('='.repeat(72))));
  console.log(pc.bold(pc.cyan('  🚀 SOLANA POOL FIRST TRANSACTION EXPLORER')));
  console.log(pc.bold(pc.cyan('='.repeat(72))));
  if (botUsername) {
    console.log(`  ${pc.bold('Telegram Console :')} ${pc.green(`Active (@${botUsername})`)}`);
  } else {
    console.log(`  ${pc.bold('Telegram Console :')} ${pc.dim('Disabled (Set TELEGRAM_TOKEN in .env to enable)')}`);
  }
  console.log(pc.cyan('-'.repeat(72)));
  console.log(pc.white('  Type a command in terminal or Telegram:'));
  console.log(`    ${pc.bold(pc.green('/scan <pooladdress>'))}  ${pc.white('- Scan initial genesis transaction & pool creator')}`);
  console.log(`    ${pc.bold(pc.blue('/help'))}                ${pc.dim('- Show command guide')}`);
  console.log(`    ${pc.bold(pc.magenta('/clear'))}               ${pc.dim('- Clear terminal screen')}`);
  console.log(`    ${pc.bold(pc.red('/exit'))}                ${pc.dim('- Exit application')}`);
  console.log(pc.cyan('-'.repeat(72)) + '\n');
}

/**
 * Print command guide / help
 */
export function printHelp() {
  console.log('\n' + pc.bold(pc.cyan('Command Guide:')));
  console.log(`  ${pc.bold(pc.green('/scan <pooladdress>'))}`);
  console.log(`      Scan Solana pool address to find the genesis transaction and creator.`);
  console.log(`      Scan results are automatically saved to ${pc.bold('state-data.json')}.`);
  console.log(`      Example: ${pc.dim('/scan xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a')}\n`);
  console.log(`  ${pc.bold(pc.magenta('/clear'))}`);
  console.log(`      Clear terminal screen.\n`);
  console.log(`  ${pc.bold(pc.red('/exit'))} or ${pc.bold(pc.red('/quit'))}`);
  console.log(`      Exit application.\n`);
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
