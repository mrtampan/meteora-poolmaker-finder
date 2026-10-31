# Solana Pool First Transaction Explorer CLI (`solana-pool-tx`)

Aplikasi CLI Node.js / JavaScript modern dan ringkas untuk mengekstrak **transaksi pertama (genesis / initial pool transaction)** dan pembuat pool (*address_by*) dari sebuah Solana pool address, lalu menyimpannya langsung ke **`state-data.json`**.

---

## 🌟 Fitur Utama

- 🎯 **Deteksi Transaksi Pertama Pool (Genesis)**: Mengambil transaksi pertama saat pool dibuat di on-chain Solana.
- 💾 **Otomatis Menyimpan ke `state-data.json`**: Hasil eksekusi otomatis tersimpan ke file `state-data.json`.
- 🧹 **Data Bersih & Terfokus**: Hanya menghasilkan atribut utama yang dibutuhkan:
  1. `signature`: Hash transaksi pembuatan pool
  2. `address_by`: Alamat wallet pembuat pool / penyetor likuiditas awal
  3. `pair_name`: Pasangan token (misal `GTA6 / SOL`)
  4. `token_name`: Nama token utama (misal `GTA VI`)
  5. `status`: Status eksekusi transaksi (`SUCCESS` / `FAILED`)
  6. `timeformatted`: Waktu transaksi on-chain
- ⌨️ **Fleksibel**: Menerima input pool address via argumen langsung atau prompt interaktif di terminal.

---

## 🚀 Penggunaan

### 1. Menjalankan Mode Interaktif (Rekomendasi)
Jalankan program dengan:
```bash
npm start
```
Setelah aplikasi berjalan, ketik command:
```bash
/scan <pooladdress>
```
Contoh:
```bash
/scan xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a
```
*(Catatan: Pool address wajib diisi. Jika kosong, sistem akan menampilkan peringatan).*

#### Command yang Tersedia di Mode Interaktif:
- `/scan <pooladdress>` : Scan genesis transaksi & pembuat pool Solana (wajib menyertakan address)
- `/help` : Menampilkan petunjuk command
- `/clear` : Membersihkan tampilan terminal
- `/exit` atau `/quit` : Keluar dari program

---

### 2. Menjalankan Langsung via CLI Argument
Anda juga dapat menjalankan scan langsung dalam satu perintah:
```bash
node src/index.js /scan xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a
```
Atau tanpa kata `/scan`:
```bash
node src/index.js xg71xrhn7MEj5akrZGteuYeiTLbBzyNCpBn69bRYd5a
```

---

## 📄 Format Hasil di `state-data.json`

Setiap kali dijalankan, data otomatis tersimpan di `state-data.json`:
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
*(Jika Anda memeriksa beberapa pool address berbeda, data baru otomatis di-akumulasi ke dalam list).*
