# CryptoSignal v3.3 — Spot + Futures, Railway

## Fitur
- Panel teratas: hingga 10 sinyal BUY spot dan 10 sinyal LONG/SHORT futures dari scanner 25 simbol per market (50 permintaan saat pemindaian). Hanya sinyal yang terkonfirmasi ditampilkan; bila kurang dari 10, hasil lebih sedikit.
- Scanner menggunakan timeframe yang dipilih, empat permintaan paralel, tombol **Scan ulang**, dan snapshot (bukan streaming). Klik **Analisis** untuk membuka rincian koin.
- Target take profit TP1/TP2/TP3 dihitung dari ATR14 (1x, 2x, 3x) dan arah sinyal. WAIT hanya menampilkan skenario hipotetis. Untuk Spot SELL, target merupakan referensi skenario BUY, bukan entry baru.
- Tetap mendukung 49 pasangan pilihan manual, grafik candle, indikator EMA/RSI/MACD/volume, dan backtest Spot eksperimental.

## Deploy ke Railway
1. Ekstrak ZIP; upload seluruh isi folder ke root repository GitHub yang terhubung ke Railway.
2. Railway mendeteksi `Dockerfile`, build dan deploy. Tidak perlu API key. Server memakai variabel `PORT` dari Railway.
3. Buka domain Railway. Klik **Scan ulang** untuk refresh ranking, atau pilih coin untuk analisis.

## Catatan penting
- Data spot dan futures dari provider publik Binance, Bybit, OKX (fallback). Ketersediaan dan simbol tergantung API, wilayah, dan koneksi Railway.
- Bila seluruh penyedia gagal, hasil scanner bisa kosong. Tidak pernah dibuat data atau sinyal palsu.
- Scanner menilai candle tertutup dan menggunakan aturan sinyal sama dengan detail analisis. Hasil tidak selalu berjumlah 10.
- Target ATR bukan jaminan tercapai, tidak memperhitungkan spread, slippage, funding, leverage atau likuidasi.
- Backtest Spot historis memakai aturan lama dan tidak dapat digunakan untuk memvalidasi sinyal scanner v3.3. Belum ada backtest futures.
- Tidak mengeksekusi order. Tidak memerlukan API key.
