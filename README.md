# Solana Pool First Transaction Explorer CLI (`solana-pool-tx`)

A modern, concise Node.js CLI & Telegram Console tool to extract the **first genesis transaction** and pool creator wallet (*address_by*) of any Solana liquidity pool address, automatically appending and updating the results in **`state-data.json`**.

---

## 🌟 Key Features

- 🎯 **Pool Genesis Transaction Detection**: Finds the very first on-chain transaction that initialized the pool on Solana.
- 💬 **Telegram Console Support**: Send commands directly from Telegram (`/scan <pooladdress>`, `/help`, `/start`).
- 💾 **Auto-Save to `state-data.json`**: Automatically saves and updates pool records in `state-data.json`.
- 🧹 **Clean & Focused Output**: Extracts only essential data fields:
  1. `signature`: Initial creation transaction hash
  2. `address_by`: Pool maker / creator wallet address
  3. `pair_name`: Token pair (e.g., `GTA6 / SOL`)
  4. `token_name`: Base token name (e.g., `GTA VI`)
  5. `status`: Transaction status (`SUCCESS` / `FAILED`)
  6. `timeformatted`: On-chain transaction timestamp
- ⌨️ **Interactive & Direct CLI**: Use an interactive console shell, Telegram bot, or direct CLI commands.

---

## 📦 Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Initialize state data file:**
   ```bash
   cp state-data.example.json state-data.json
   ```

4. **(Optional) Configure Telegram Bot in `.env`:**
   ```env
   TELEGRAM_TOKEN="your_bot_token_from_botfather"
   TELEGRAM_CHAT_ID="your_telegram_chat_id"
   ```

---

## 🚀 Usage

### Run the program:
```bash
npm start
```

### Simple Command (Terminal or Telegram):
Type or send:
```text
/scan <pooladdress>
```
Example:
```text
/scan xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a
```

*(Note: Pool address is required. If empty, a warning will be displayed).*

---

### Telegram Setup (Optional)
If you configure `TELEGRAM_TOKEN` (and optional `TELEGRAM_CHAT_ID`) in `.env`, `npm start` will automatically listen for `/scan <pooladdress>` from your Telegram bot at the same time:
1. Set token in `.env`:
   ```env
   TELEGRAM_TOKEN="your_bot_token"
   TELEGRAM_CHAT_ID="your_chat_id"
   ```
2. Run `npm start`.
3. In Telegram, simply send:
   ```text
   /scan <pooladdress>
   ```

---

### Direct CLI Command
You can also run a scan directly from the terminal without entering the interactive prompt:
```bash
node src/index.js /scan xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a
```

---

## 📄 Output Format in `state-data.json`

Every time a scan runs (from Terminal or Telegram), the result is saved to `state-data.json`:
```json
[
  {
    "signature": "5786qDFxu8CQgimbrkYjJJfVsPNtmGPrFsw6jyQtxi4HMmYVY419HSv44mArqhKZKBmRKypCh6tYiva3LBfvfVJy",
    "address_by": "gh7gW8FtC8ygPnM8GMPtaufTXenNvck8Fi4cR2Up82w",
    "pair_name": "GTA6 / SOL",
    "token_name": "GTA VI",
    "status": "SUCCESS",
    "timeformatted": "Aug 28, 02:16:16"
  }
]
```
*(Scanning different pool addresses will accumulate new records into the array).*
