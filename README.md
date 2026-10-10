# CryptoSignal v3.4 — Spot + Futures (Railway)

## Baru
- 131 koin dalam daftar analisis manual, termasuk meme token yang dikenal di berbagai exchange (misalnya MEXC).
- Pilihan scanner: 25 koin utama, 40 meme, atau semua koin. Pemindaian besar membutuhkan waktu dan dapat terkena rate limit.
- MEXC Spot sebagai fallback tambahan untuk data candle; Futures masih menggunakan Bybit/Binance/OKX.
- Daftar pasangan tidak menjamin listing aktif atau ketersediaan kontrak futures pada setiap exchange. Jika tak tersedia, tampilkan DATA ERROR; jangan menganggapnya WAIT.
- Top 10 Spot BUY, Top 10 Futures LONG/SHORT, TP1/TP2/TP3 tetap ada.

## Deploy
Upload `index.html`, `server.js`, `Dockerfile`, `README.md` ke root repository GitHub yang terhubung dengan Railway, commit, dan tunggu redeploy.

## Risiko
Sinyal dan target ATR bersifat indikatif. Meme token sering tidak likuid, memiliki spread/slippage tinggi, dan rentan pergerakan ekstrem. Data dan hasil sinyal belum diverifikasi secara live pada Railway.
