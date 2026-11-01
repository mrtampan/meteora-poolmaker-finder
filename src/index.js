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
  .option('-d, --daemon', 'Run in background daemon mode (for PM2 / VPS)')
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

    const isDaemon = Boolean(options.daemon || process.env.pm_id !== undefined || process.env.PM2_HOME !== undefined);

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

    // If running in daemon mode (PM2 / VPS)
    if (isDaemon) {
      console.log('\n' + pc.bold(pc.cyan('='.repeat(72))));
      console.log(pc.bold(pc.cyan('  🤖 SOLANA POOL EXPLORER - PM2 DAEMON MODE')));
      console.log(pc.bold(pc.cyan('='.repeat(72))));
      if (botUsername) {
        console.log(`  ✓ Telegram Bot : ${pc.green(pc.bold('@' + botUsername))}`);
        console.log(`  ✓ Status       : ${pc.green('Online and listening for /scan commands')}`);
      } else {
        console.log(`  ⚠️ Telegram Bot : ${pc.yellow('Disabled (Set TELEGRAM_TOKEN in .env to enable)')}`);
      }
      console.log(pc.cyan('-'.repeat(72)) + '\n');
      console.log(pc.dim('[PM2] Service is running in background. Stop with pm2 stop solana-pool-bot\n'));

      // Keep process alive and handle graceful shutdown
      await new Promise((resolve) => {
        const onShutdown = (signal) => {
          console.log(pc.cyan(`\n[PM2] Received ${signal}. Shutting down gracefully...`));
          if (tgBot) tgBot.stopPolling();
          resolve();
        };
        process.on('SIGINT', () => onShutdown('SIGINT'));
        process.on('SIGTERM', () => onShutdown('SIGTERM'));
      });
      return;
    }

    // Otherwise, start interactive command mode (default for local npm start)
    try {
      await startInteractiveCli(async (target) => {
        return await executeScan(target, options);
      }, { botUsername });
    } finally {
      if (tgBot) {
        tgBot.stopPolling();
      }
      process.exit(0);
    }
  });

program.parse(process.argv);
