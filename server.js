const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const port=Number(process.env.PORT||3000);
const html=fs.readFileSync(path.join(__dirname,'index.html'));
const symbols=new Set(['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','ADAUSDT','DOGEUSDT']);
const intervals=new Set(['15m','1h','4h','1d']);
const send=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
const providers={
 spot:[['Binance Spot','https://api.binance.com/api/v3/klines'],['Binance Spot Data','https://data-api.binance.vision/api/v3/klines'],['Binance US Spot','https://api.binance.us/api/v3/klines']],
 futures:[['Binance Futures','https://fapi.binance.com/fapi/v1/klines'],['Binance Futures 1','https://fapi1.binance.com/fapi/v1/klines'],['Binance Futures 2','https://fapi2.binance.com/fapi/v1/klines']]
};
const cache=new Map();
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/'||url.pathname==='/index.html'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});return res.end(html)}
 if(url.pathname==='/favicon.ico'){res.writeHead(204);return res.end()}
 if(url.pathname==='/health')return send(res,200,{status:'ok'});
 if(url.pathname!=='/api/klines')return send(res,404,{error:'Not found'});
 const market=url.searchParams.get('market'),symbol=url.searchParams.get('symbol'),interval=url.searchParams.get('interval');
 if(!providers[market]||!symbols.has(symbol)||!intervals.has(interval))return send(res,400,{error:'Invalid market, symbol or interval'});
 const key=`${market}:${symbol}:${interval}`,cached=cache.get(key);
 if(cached&&Date.now()-cached.time<30000)return send(res,200,{rows:cached.rows,source:cached.source,cached:true});
 const failures=[];
 for(const [name,base] of providers[market]){
  try{
   const target=`${base}?symbol=${symbol}&interval=${interval}&limit=200`;
   const response=await fetch(target,{signal:AbortSignal.timeout(6500),headers:{Accept:'application/json','User-Agent':'CryptoSignal-MVP/3.1'}});
   if(!response.ok)throw Error(`HTTP ${response.status}`);
   const rows=await response.json();
   if(!Array.isArray(rows)||rows.length<80||!rows.every(r=>Array.isArray(r)&&r.length>=7&&Number.isFinite(Number(r[4]))))throw Error('Invalid candle payload');
   cache.set(key,{rows,source:name,time:Date.now()});
   console.log(`Data OK ${market} ${symbol} via ${name}`);
   return send(res,200,{rows,source:name,cached:false});
  }catch(e){failures.push(`${name}: ${e.message}`);console.warn(`Data provider failed: ${market} ${name}: ${e.message}`)}
 }
 if(cached&&Date.now()-cached.time<300000)return send(res,200,{rows:cached.rows,source:cached.source,cached:true,stale:true});
 console.error(`All providers failed ${market} ${symbol}: ${failures.join(' | ')}`);
 return send(res,502,{error:'Semua sumber data gagal',details:failures});
}).listen(port,'0.0.0.0',()=>console.log(`CryptoSignal listening on ${port}`));
