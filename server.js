const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const port = Number(process.env.PORT || 3000);
const html = fs.readFileSync(path.join(__dirname, 'index.html'));
const allowedSymbols = new Set(['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','ADAUSDT','DOGEUSDT']);
const allowedIntervals = new Set(['15m','1h','4h','1d']);
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-cache'});
    return res.end(html);
  }
  if (url.pathname === '/health') { res.writeHead(200, {'Content-Type':'text/plain'}); return res.end('ok'); }
  if (url.pathname !== '/api/klines') {res.writeHead(404);return res.end('Not found');}
  const market=url.searchParams.get('market'), symbol=url.searchParams.get('symbol'), interval=url.searchParams.get('interval');
  if (!['spot','futures'].includes(market) || !allowedSymbols.has(symbol) || !allowedIntervals.has(interval)) {
    res.writeHead(400, {'Content-Type':'application/json'}); return res.end(JSON.stringify({error:'Invalid market, symbol, or interval'}));
  }
  const host=market==='spot'?'https://api.binance.com':'https://fapi.binance.com';
  const endpoint=market==='spot'?'/api/v3/klines':'/fapi/v1/klines';
  const target=`${host}${endpoint}?symbol=${symbol}&interval=${interval}&limit=200`;
  try {
    const response=await fetch(target,{signal:AbortSignal.timeout(12000),headers:{'Accept':'application/json'}});
    if(!response.ok) throw new Error(`Provider HTTP ${response.status}`);
    const data=await response.json();
    if(!Array.isArray(data)||!data.every(x=>Array.isArray(x)&&x.length>=7)) throw new Error('Unexpected provider response');
    res.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    return res.end(JSON.stringify(data));
  } catch(e) {
    res.writeHead(502, {'Content-Type':'application/json; charset=utf-8'});
    return res.end(JSON.stringify({error:'Market data unavailable', detail:e.message}));
  }
}).listen(port, '0.0.0.0', () => console.log(`Listening on ${port}`));
