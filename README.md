# CryptoSignal Spot + Futures — Railway MVP

Website responsif untuk sinyal **Spot BUY/SELL/WAIT** dan **USDT-M Futures LONG/SHORT/WAIT**. Data candle Binance lewat backend Node.js (`/api/klines`), tanpa API key dan tanpa eksekusi order.

## Deploy ke Railway
1. Upload **isi folder ini** ke root repository GitHub (`index.html`, `server.js`, `Dockerfile`, `README.md`).
2. Railway → New Project → Deploy from GitHub repo → pilih repository.
3. Railway membaca Dockerfile secara otomatis. Setelah deploy, buka service → Settings → Networking → Generate Domain.
4. Kunjungi domain tersebut; pilih market Spot atau Futures USDT-M dan tekan Analisis sekarang.

## Data & logika
- Spot: `https://api.binance.com/api/v3/klines`; Futures: `https://fapi.binance.com/fapi/v1/klines`. Server memvalidasi market, simbol, dan timeframe lalu meneruskan permintaan.
- Candle belum tertutup diabaikan. Konfirmasi: EMA20/50, RSI14, MACD histogram, volume vs rata-rata 20 candle.
- Spot: BUY/SELL/WAIT. Futures: LONG/SHORT/WAIT. SHORT memakai level stop di atas entry dan target di bawah entry.
- Backtest yang ada hanya untuk spot, dinonaktifkan saat memilih futures agar tidak menyajikan hasil keliru.

## Batasan penting
Tidak ada order otomatis, akun, leverage, liquidation price, funding rate, open interest, slippage, spread atau backtest futures. Sinyal bukan jaminan profit. Binance dapat memblokir akses dari IP Railway tertentu.

## Jalankan lokal
Memerlukan Node.js 22+. Jalankan `node server.js` lalu buka `http://localhost:3000`.
