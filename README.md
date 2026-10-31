# Solana Pool First Transaction Explorer CLI (`solana-pool-tx`)

A modern, concise Node.js CLI tool to extract the **first genesis transaction** and pool creator wallet (*address_by*) of any Solana liquidity pool address, automatically appending and updating the results in **`state-data.json`**.

---

## 🌟 Key Features

- 🎯 **Pool Genesis Transaction Detection**: Finds the very first on-chain transaction that initialized the pool on Solana.
- 💾 **Auto-Save to `state-data.json`**: Automatically saves and updates pool records in `state-data.json`.
- 🧹 **Clean & Focused Output**: Extracts only essential data fields:
  1. `signature`: Initial creation transaction hash
  2. `address_by`: Pool maker / creator wallet address
  3. `pair_name`: Token pair (e.g., `GTA6 / SOL`)
  4. `token_name`: Base token name (e.g., `GTA VI`)
  5. `status`: Transaction status (`SUCCESS` / `FAILED`)
  6. `timeformatted`: On-chain transaction timestamp
- ⌨️ **Interactive & Direct CLI**: Use an interactive console shell or run direct CLI commands.

---

## 🚀 Usage

### 1. Interactive Mode (Recommended)
Start the program using:
```bash
npm start
```
Once the console prompt appears, type:
```bash
/scan <pooladdress>
```
Example:
```bash
/scan xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a
```
*(Note: A pool address is required. If left empty, a warning will be displayed).*

#### Available Commands in Interactive Mode:
- `/scan <pooladdress>` : Scan genesis transaction & creator of the given Solana pool
- `/help` : Display command guide
- `/clear` : Clear the terminal screen
- `/exit` or `/quit` : Exit the application

---

### 2. Direct CLI Command
You can also run a scan directly from the terminal:
```bash
node src/index.js /scan xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a
```
Or simply pass the pool address:
```bash
node src/index.js xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a
```

---

## 📄 Output Format in `state-data.json`

Every time a scan runs, the result is saved to `state-data.json`:
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
