// src/telegram.js
import dotenv from 'dotenv';
import pc from 'picocolors';
import { isValidSolanaAddress } from './prompt.js';

dotenv.config();

/**
 * Escapes HTML characters for Telegram HTML parse mode
 */
export function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format scan result into a clean Telegram HTML message
 */
export function formatTelegramMessage(resultItem, poolInfo) {
  const statusEmoji = resultItem.status === 'SUCCESS' ? '✅' : '❌';
  const pairName = escapeHtml(resultItem.pair_name || poolInfo?.pairName || 'Unknown');
  const tokenName = escapeHtml(resultItem.token_name || poolInfo?.baseToken?.name || '');
  const dex = escapeHtml(poolInfo?.dex || 'Unknown');
  const poolAddress = escapeHtml(poolInfo?.address || 'N/A');
  const addressBy = escapeHtml(resultItem.address_by || 'Unknown');
  const signature = escapeHtml(resultItem.signature || 'N/A');
  const timeFormatted = escapeHtml(resultItem.timeformatted || 'N/A');
  const txUrl = `https://solscan.io/tx/${resultItem.signature}`;
  const explorerUrl = poolInfo?.url || `https://solscan.io/account/${poolInfo?.address}`;

  return [
    `🚀 <b>Solana Pool Genesis Explorer</b>`,
    ``,
    `🏷️ <b>Pair:</b> <code>${pairName}</code> ${tokenName ? `(${tokenName})` : ''}`,
    `🏢 <b>DEX:</b> <code>${dex}</code>`,
    `📍 <b>Pool:</b> <code>${poolAddress}</code>`,
    ``,
    `👤 <b>Address By (Creator):</b>`,
    `<code>${addressBy}</code>`,
    ``,
    `📜 <b>Genesis Signature:</b>`,
    `<code>${signature}</code>`,
    ``,
    `⚡ <b>Status:</b> ${statusEmoji} <b>${resultItem.status}</b>`,
    `⏰ <b>Time:</b> <code>${timeFormatted}</code>`,
    ``,
    `🔗 <a href="${txUrl}">Solscan Tx</a> | <a href="${explorerUrl}">DexScreener</a>`
  ].join('\n');
}

/**
 * Lightweight Telegram Bot Client
 */
export class TelegramBotClient {
  constructor(token, options = {}) {
    this.token = token;
    this.allowedChatId = options.allowedChatId || process.env.TELEGRAM_CHAT_ID || null;
    this.isRunning = false;
    this.abortController = null;
    this.botInfo = null;
    this.processedUpdates = new Set();
  }

  async callApi(method, body = {}) {
    const url = `https://api.telegram.org/bot${this.token}/${method}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  }

  async getMe() {
    const data = await this.callApi('getMe');
    if (!data.ok) {
      throw new Error(data.description || 'Failed to authenticate Telegram bot token');
    }
    this.botInfo = data.result;
    return this.botInfo;
  }

  async sendMessage(chatId, text, extra = {}) {
    return await this.callApi('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...extra
    });
  }

  async editMessage(chatId, messageId, text, extra = {}) {
    return await this.callApi('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...extra
    });
  }

  async startPolling(onScanHandler) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.abortController = new AbortController();

    let offset = 0;

    while (this.isRunning) {
      try {
        const url = `https://api.telegram.org/bot${this.token}/getUpdates?offset=${offset}&timeout=25`;
        const res = await fetch(url, { signal: this.abortController.signal });
        const data = await res.json();

        if (!data.ok) {
          if (data.error_code === 401) {
            console.error(pc.red(`\n❌ Telegram Error: Invalid Bot Token`));
            this.stopPolling();
            break;
          }
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        if (Array.isArray(data.result)) {
          for (const update of data.result) {
            offset = update.update_id + 1;

            if (this.processedUpdates.has(update.update_id)) {
              continue;
            }
            this.processedUpdates.add(update.update_id);
            if (this.processedUpdates.size > 500) {
              const firstKey = this.processedUpdates.values().next().value;
              this.processedUpdates.delete(firstKey);
            }

            if (update.message && update.message.text) {
              await this.handleMessage(update.message, onScanHandler).catch(() => {});
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError' || !this.isRunning) break;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  stopPolling() {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async handleMessage(message, onScanHandler) {
    const chatId = message.chat.id;
    const rawText = message.text ? message.text.trim() : '';

    if (this.allowedChatId && String(chatId) !== String(this.allowedChatId)) {
      return;
    }

    const cleanText = rawText.replace(/@\w+bot/i, '').trim();

    // /start or /help
    if (cleanText === '/start' || cleanText === '/help') {
      const msg = [
        `🚀 <b>Solana Pool Explorer</b>`,
        ``,
        `Type or send:`,
        `<code>/scan &lt;pooladdress&gt;</code>`,
        ``,
        `<b>Example:</b>`,
        `<code>/scan xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a</code>`
      ].join('\n');
      await this.sendMessage(chatId, msg);
      return;
    }

    // /scan <pooladdress>
    if (cleanText.startsWith('/scan')) {
      const target = cleanText.replace(/^\/scan\s*/i, '').trim();

      if (!target) {
        await this.sendMessage(chatId, `⚠️ <b>Warning: Pool address is required!</b>\n\nFormat: <code>/scan &lt;pooladdress&gt;</code>`);
        return;
      }

      if (!isValidSolanaAddress(target)) {
        await this.sendMessage(chatId, `❌ <b>Error:</b> Address <code>${escapeHtml(target)}</code> is not a valid Solana address.`);
        return;
      }

      const loadingMsg = await this.sendMessage(chatId, `⏳ <i>Scanning pool <code>${escapeHtml(target)}</code>...</i>`);

      try {
        const result = await onScanHandler(target);
        if (result && result.resultItem) {
          const formatted = formatTelegramMessage(result.resultItem, result.poolInfo);
          if (loadingMsg && loadingMsg.ok && loadingMsg.result?.message_id) {
            await this.editMessage(chatId, loadingMsg.result.message_id, formatted).catch(async () => {
              await this.sendMessage(chatId, formatted);
            });
          } else {
            await this.sendMessage(chatId, formatted);
          }
        } else {
          const failMsg = `❌ <b>Failed:</b> Genesis transaction not found for pool <code>${escapeHtml(target)}</code>.`;
          if (loadingMsg && loadingMsg.ok && loadingMsg.result?.message_id) {
            await this.editMessage(chatId, loadingMsg.result.message_id, failMsg).catch(async () => {
              await this.sendMessage(chatId, failMsg);
            });
          } else {
            await this.sendMessage(chatId, failMsg);
          }
        }
      } catch (err) {
        await this.sendMessage(chatId, `❌ <b>Error:</b> ${escapeHtml(err.message)}`);
      }
      return;
    }

    // Direct address pasted without /scan
    if (isValidSolanaAddress(cleanText)) {
      const loadingMsg = await this.sendMessage(chatId, `⏳ <i>Scanning pool <code>${escapeHtml(cleanText)}</code>...</i>`);
      try {
        const result = await onScanHandler(cleanText);
        if (result && result.resultItem) {
          const formatted = formatTelegramMessage(result.resultItem, result.poolInfo);
          if (loadingMsg && loadingMsg.ok && loadingMsg.result?.message_id) {
            await this.editMessage(chatId, loadingMsg.result.message_id, formatted).catch(async () => {
              await this.sendMessage(chatId, formatted);
            });
          } else {
            await this.sendMessage(chatId, formatted);
          }
        } else {
          const failMsg = `❌ <b>Failed:</b> Genesis transaction not found for pool <code>${escapeHtml(cleanText)}</code>.`;
          if (loadingMsg && loadingMsg.ok && loadingMsg.result?.message_id) {
            await this.editMessage(chatId, loadingMsg.result.message_id, failMsg).catch(async () => {
              await this.sendMessage(chatId, failMsg);
            });
          } else {
            await this.sendMessage(chatId, failMsg);
          }
        }
      } catch (err) {
        await this.sendMessage(chatId, `❌ <b>Error:</b> ${escapeHtml(err.message)}`);
      }
    }
  }
}
