# CryptoSignal v3.6 — Railway

## Perubahan
- Ranking scanner memakai skor konfirmasi (45%), kekuatan tren EMA20-EMA50 dibagi ATR (30%), estimasi likuiditas volume 24 jam MEXC (20%), dan RR target ATR (5%).
- RR teoretis: stop 2×ATR dan TP2 3×ATR = 1.5 sebelum fee/slippage; bukan jaminan tercapai.
- Volume MEXC Spot adalah proksi likuiditas dan mungkin tidak mencerminkan likuiditas Futures exchange lain. Jika data volume tidak tersedia, skor komponen itu nol.
- Daftar MEXC Spot dinamis, Futures hanya pasangan yang tersedia di penyedia Futures.

## Deploy
Ekstrak seluruh file ke root repo GitHub yang terhubung Railway, commit, tunggu redeploy. Periksa /health.

## Keterbatasan
API publik dapat dibatasi secara geografis atau rate limit. Belum diuji live di Railway. Backtest spot memakai aturan lama; ranking ini bukan hasil backtest. Tidak ada order otomatis.


## v3.7 — Filter pasar dan strategi
- Gaya scalping memilih candle 15m, swing memilih 4h, manual memakai pilihan timeframe. Ini preset timeframe, bukan strategi baru yang sudah dibacktest.
- Filter volume USDT 24 jam memakai ticker MEXC Spot.
- Spread dihitung dari (ask-bid)/mid × 100 melalui endpoint publik MEXC Spot `/api/v3/ticker/bookTicker`. Endpoint internal `/api/spreads` memaparkan snapshot spread.
- Spread futures **bukan** spread Spot. Filter spread ini hanya proksi likuiditas untuk futures.
- Jika data spread gagal, kandidat tidak lolos filter spread kecuali filter dinonaktifkan. Jika volume tidak tersedia, kandidat gagal filter volume positif.
- Scanner bisa menampilkan kurang dari 10 sinyal. Tidak ada jaminan profit atau validasi performa strategi.


## v3.8 Live candle
Grafik menampilkan candle berjalan dan polling endpoint `/api/live-candle` setiap 10 detik (bukan tick-by-tick WebSocket). Indikator dan sinyal tetap berdasarkan candle tertutup dan diperbarui ketika tombol Analisis ditekan. Jika sumber data terblokir atau hanya menyajikan candle tertutup, status LIVE akan menampilkan error atau data tertunda. Tidak ada data harga sintetis. Scanner tetap snapshot.


## v3.9 Lonjakan 15m
Panel teratas memantau 60 pasangan USDT MEXC Spot dengan volume terbesar, setiap ~60 detik (cache server 60 detik). Ambang +3% dibanding penutupan candle sebelumnya dengan harga candle aktif. Ini **bukan** rolling 15 menit yang presisi. Jika API gagal, tampilkan error, bukan lonjakan palsu. Notifikasi browser hanya muncul jika izin telah diberikan secara terpisah; versi ini secara default menampilkan notifikasi di halaman. Tidak ada push saat tab ditutup. Endpoint: GET /api/movers.


## v4.0: Perbaikan daftar Futures
- `/api/futures-catalog` memuat kontrak USDT perpetual aktif dari OKX.
- Dropdown Spot menggunakan katalog MEXC; dropdown Futures hanya kontrak OKX yang tersedia.
- Scanner melewati koin tanpa kontrak Futures.
- API mengembalikan 422 untuk kontrak yang tidak tersedia, bukan sinyal WAIT.
- Jika katalog OKX gagal dimuat, pilihan Futures dinonaktifkan hingga data tersedia.
- Dukungan Bybit/Binance tetap fallback, tetapi katalog Futures saat ini menggunakan OKX.
