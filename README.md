# CryptoSignal Spot + Futures — Railway v3.1

Perbaikan HTTP 502: backend mencoba beberapa endpoint Binance secara berurutan, mencatat error per provider di Deploy Logs, dan menyediakan cache singkat. Spot memiliki fallback Binance US (harga/volume bisa berbeda dari Binance global). Futures **tidak** fallback ke Spot karena datanya berbeda.

## Deploy
1. Ekstrak ZIP dan upload semua file (`index.html`, `server.js`, `Dockerfile`, `.nojekyll`, `README.md`) ke root repository GitHub.
2. Commit ke branch yang terhubung dengan Railway; tunggu deployment berhasil.
3. Buka `/health` pada domain Railway untuk memastikan server berjalan.
4. Buka website, pilih Spot/Futures dan tekan Analisis sekarang.
5. Jika tetap HTTP 502, buka Railway > service > Deploy Logs dan cari `Data provider failed` / `All providers failed`.

Railway menggunakan Dockerfile yang ada. Tidak perlu environment variable maupun API key.

**Catatan:** Endpoint futures bisa tetap gagal karena pembatasan IP/wilayah. Ini bukan jaminan pemulihan. Bila semua endpoint futures diblokir, diperlukan provider futures lain dengan data OHLCV yang kompatibel. Data Spot Binance US tidak identik dengan Binance global. Tidak ada transaksi otomatis; sinyal bukan rekomendasi investasi. Backtest futures belum tersedia.
