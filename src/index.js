#!/usr/bin/env node

// src/index.js
import { Command } from 'commander';
import pc from 'picocolors';
import { startInteractiveCli } from './prompt.js';
import { TelegramBotClient } from './telegram.js';
import { executeScan } from './scanner.js';

export { executeScan };

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
      const res = await executeScan(poolTarget, options);
      process.exit(res ? 0 : 1);
    }

    // Optional background Telegram Bot listener if TELEGRAM_TOKEN is set
    let tgBot = null;
    let botUsername = null;
    if (process.env.TELEGRAM_TOKEN) {
      try {
        tgBot = new TelegramBotClient(process.env.TELEGRAM_TOKEN, {
          allowedChatId: process.env.TELEGRAM_CHAT_ID
        });
        const me = await tgBot.getMe();
        botUsername = me.username;
        tgBot.startPolling(async (target) => {
          return await executeScan(target, options);
        });
      } catch (err) {
        console.warn(pc.yellow(`[Telegram Warning] Could not connect Telegram bot (${err.message})`));
      }
    }

    // Start interactive command mode (default for npm start)
    try {
      await startInteractiveCli(async (target) => {
        return await executeScan(target, options);
      }, { botUsername });
    } finally {
      if (tgBot) {
        tgBot.stopPolling();
      }
    }
  });

program.parse(process.argv);
