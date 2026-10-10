const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const port=Number(process.env.PORT||3000),html=fs.readFileSync(path.join(__dirname,'index.html'));
const coins='BTC ETH SOL BNB XRP ADA DOGE AVAX LINK DOT LTC BCH TRX TON SHIB PEPE SUI NEAR APT ARB OP INJ UNI AAVE ETC ATOM FIL ICP RENDER FET WIF BONK SEI TIA JUP GALA SAND MANA ALGO HBAR XLM VET EOS RUNE PENDLE ENA WLD CRV DYDX FLOKI BABYDOGE TURBO NEIRO POPCAT MEW BOME BRETT MOG PONKE GIGA SPX FARTCOIN PENGU TRUMP MELANIA AI16Z GOAT ACT PNUT CHILLGUY MOODENG CAT NOT HMSTR DOGS SLERF PEOPLE MEME DEGEN TOSHI COQ LADYS MYRO BILLY FWOG MICHI ZEREBRO UFD VINE BANANAS31 1000SATS 1000PEPE ONDO JASMY LDO STX IMX AR KAS PYTH TWT AXS ZRO ZK STRK ETHFI EIGEN NOTIO RAY JTO GRASS VIRTUAL KAITO AERO W ZIL COMP SUSHI 1INCH CELO KAVA MINA ROSE CFX CHZ GRT GMT NEO IOTA THETA EGLD'.split(' ');
const symbols=new Set(coins.map(x=>x+'USDT')),intervals=new Set(['15m','1h','4h','1d']);
const cache=new Map();const send=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body))};
const intervalMs={'15m':900000,'1h':3600000,'4h':14400000,'1d':86400000};
function validate(rows){if(!Array.isArray(rows)||rows.length<80)throw Error('Candle kurang dari 80');rows.sort((a,b)=>+a[0]-+b[0]);if(!rows.every(r=>Array.isArray(r)&&r.length>=7&&[0,1,2,3,4,5,6].every(i=>Number.isFinite(Number(r[i])))&&Number(r[4])>0))throw Error('Payload candle tidak valid');return rows}
async function request(url){const response=await fetch(url,{signal:AbortSignal.timeout(6500),headers:{Accept:'application/json','User-Agent':'CryptoSignal/3.2'}});if(!response.ok)throw Error('HTTP '+response.status);let text=await response.text();if(!text.trim())throw Error('Respons kosong');try{return JSON.parse(text)}catch{throw Error('JSON tidak valid')}}
function binance(data){return validate(data)}
function mexcSpot(data){return validate(data)}
function bybit(data,interval){if(data.retCode!==0||!Array.isArray(data.result?.list))throw Error(data.retMsg||'Bybit payload error');return validate(data.result.list.map(r=>{let t=+r[0];return [t,r[1],r[2],r[3],r[4],r[5],t+intervalMs[interval]-1]}))}
function okx(data,interval){if(data.code!=='0'||!Array.isArray(data.data))throw Error(data.msg||'OKX payload error');return validate(data.data.map(r=>{let t=+r[0];return [t,r[1],r[2],r[3],r[4],r[5],t+intervalMs[interval]-1]}))}
function providers(market,symbol,interval){const q=`symbol=${symbol}&interval=${interval}&limit=200`;const inst=symbol.slice(0,-4)+'-USDT'+(market==='futures'?'-SWAP':'');const okxBar={'15m':'15m','1h':'1H','4h':'4H','1d':'1D'}[interval];const bybitInterval={'15m':'15','1h':'60','4h':'240','1d':'D'}[interval];let out=[];
if(market==='spot')out.push(['Binance Spot Data',`https://data-api.binance.vision/api/v3/klines?${q}`,binance],['Binance Spot',`https://api.binance.com/api/v3/klines?${q}`,binance],['MEXC Spot',`https://api.mexc.com/api/v3/klines?${q}`,mexcSpot]);
else out.push(['Bybit Linear Futures',`https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${bybitInterval}&limit=200`,d=>bybit(d,interval)],['Binance Futures',`https://fapi.binance.com/fapi/v1/klines?${q}`,binance]);
out.push(['OKX '+(market==='futures'?'Perpetual Swap':'Spot'),`https://www.okx.com/api/v5/market/history-candles?instId=${inst}&bar=${okxBar}&limit=200`,d=>okx(d,interval)]);
return out}
// OKX perpetual instruments are distinct from the MEXC Spot catalog.
let futuresCatalogCache=null;
async function futuresCatalog(){
 if(futuresCatalogCache&&Date.now()-futuresCatalogCache.time<15*60*1000)return {...futuresCatalogCache,cache:true};
 try{
  const data=await request('https://www.okx.com/api/v5/public/instruments?instType=SWAP');
  if(data.code!=='0'||!Array.isArray(data.data))throw Error('Katalog OKX tidak valid');
  const instruments=data.data.filter(x=>x.settleCcy==='USDT'&&x.state==='live'&&x.instId?.endsWith('-USDT-SWAP'));
  const list=[...new Set(instruments.map(x=>x.instId.slice(0,-10).replace('-','')+'USDT'))].filter(x=>/^[A-Z0-9]+USDT$/.test(x));
  futuresCatalogCache={symbols:list,time:Date.now(),source:'OKX USDT perpetual',count:list.length};
  return futuresCatalogCache;
 }catch(e){if(futuresCatalogCache)return {...futuresCatalogCache,stale:true,warning:e.message};throw e}
}
// Dynamic MEXC spot catalog; cached for 15 minutes, stale cache used if MEXC is unreachable.
let catalogCache=null;
const CATALOG_TTL=15*60*1000;
async function catalog(force=false){
 if(!force&&catalogCache&&Date.now()-catalogCache.time<CATALOG_TTL)return {...catalogCache,cache:true};
 try{
  const info=await request('https://api.mexc.com/api/v3/exchangeInfo');
  if(!Array.isArray(info.symbols))throw Error('Daftar simbol MEXC tidak valid');
  const list=info.symbols.filter(x=>x&&x.quoteAsset==='USDT'&&/^[A-Z0-9]{2,32}USDT$/.test(x.symbol)&&
    (x.status==='ENABLED'||x.status==='1'||x.status===1||x.status==='TRADING')&&
    !/(?:3L|3S|5L|5S|2L|2S|BULL|BEAR)USDT$/.test(x.symbol))
    .map(x=>x.symbol);
  if(!list.length)throw Error('Tidak ada pasangan USDT aktif');
  let tickers=[];try{let t=await request('https://api.mexc.com/api/v3/ticker/24hr');tickers=Array.isArray(t)?t:[]}catch(e){console.warn('MEXC ticker unavailable:',e.message)}
  const allowed=new Set(list),volumes=new Map();
  for(const t of tickers){if(!allowed.has(t.symbol))continue;let q=Number(t.quoteVolume);if(!(q>0)){const base=Number(t.volume),last=Number(t.lastPrice);q=base>0&&last>0?base*last:0}volumes.set(t.symbol,q)}
  const sorted=[...new Set(list)].sort((a,b)=>(volumes.get(b)||0)-(volumes.get(a)||0)||a.localeCompare(b));
  catalogCache={symbols:sorted,volumes:Object.fromEntries(sorted.map(x=>[x,volumes.get(x)||0])),source:'MEXC Spot',time:Date.now(),count:sorted.length,hasVolume:volumes.size>0};
  console.log('MEXC catalog loaded:',sorted.length,'pairs');return {...catalogCache,cache:false};
 }catch(e){console.warn('MEXC catalog failed:',e.message);if(catalogCache)return {...catalogCache,cache:true,stale:true,warning:e.message};throw e}
}

// 15-minute price surge watcher. This is a sampled watchlist, not all MEXC listings.
let moversCache=null, moversPending=null;
async function movers(){
 if(moversCache&&Date.now()-moversCache.time<60000)return {...moversCache,cache:true};
 if(moversPending)return moversPending;
 moversPending=(async()=>{
  const c=await catalog();const selected=c.symbols.slice(0,60);let cursor=0,failed=0;const found=[];
  async function worker(){while(cursor<selected.length){const symbol=selected[cursor++];try{
   const data=await request(`https://api.mexc.com/api/v3/klines?symbol=${symbol}&interval=15m&limit=3`);
   if(!Array.isArray(data)||data.length<2)throw Error('Candle kurang');
   const rows=[...data].sort((a,b)=>Number(a[0])-Number(b[0]));
   // Last row may be live; compare its last traded close with preceding candle close.
   const prev=Number(rows.at(-2)[4]),last=Number(rows.at(-1)[4]);
   if(!(prev>0&&last>0))throw Error('Harga tidak valid');
   const change=(last/prev-1)*100;
   if(change>=3)found.push({symbol,changePct:+change.toFixed(2),price:last,volume24h:c.volumes[symbol]||0,observedAt:Date.now()});
  }catch(e){failed++}}}
  await Promise.all(Array.from({length:5},worker));
  found.sort((a,b)=>b.changePct-a.changePct);
  moversCache={items:found.slice(0,15),thresholdPct:3,scanned:selected.length,failed,source:'MEXC Spot 15m candles',time:Date.now(),note:'Perubahan dari penutupan candle 15m sebelumnya ke harga candle aktif; bukan jendela rolling tepat 15 menit.'};
  return moversCache;
 })();
 try{return await moversPending}finally{moversPending=null}
}

http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/'||url.pathname==='/index.html'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(html)}if(url.pathname==='/favicon.ico'){res.writeHead(204);return res.end()}if(url.pathname==='/health')return send(res,200,{status:'ok',version:'3.9'});if(url.pathname==='/api/movers'){try{return send(res,200,await movers())}catch(e){return send(res,503,{error:'Pemantau lonjakan belum tersedia',details:e.message})}}if(url.pathname==='/api/catalog'){
 try{const data=await catalog();return send(res,200,data)}catch(e){return send(res,503,{error:'Katalog MEXC tidak tersedia',details:e.message})}
}
if(url.pathname==='/api/futures-catalog'){try{return send(res,200,await futuresCatalog())}catch(e){return send(res,503,{error:'Katalog Futures tidak tersedia',details:e.message})}}
if(url.pathname==='/api/spreads'){
 try{
  const raw=await request('https://api.mexc.com/api/v3/ticker/bookTicker');
  if(!Array.isArray(raw))throw Error('Format bookTicker tidak valid');
  const spreads={};for(const t of raw){const bid=Number(t.bidPrice),ask=Number(t.askPrice);if(typeof t.symbol==='string'&&bid>0&&ask>=bid)spreads[t.symbol]=+(200*(ask-bid)/(ask+bid)).toFixed(5)}
  return send(res,200,{source:'MEXC Spot bookTicker',spreads,updatedAt:Date.now()});
 }catch(e){return send(res,503,{error:'Spread tidak tersedia',details:e.message})}
}
if(!['/api/klines','/api/live-candle'].includes(url.pathname))return send(res,404,{error:'Not found'});let market=url.searchParams.get('market'),symbol=url.searchParams.get('symbol'),interval=url.searchParams.get('interval');
if(!['spot','futures'].includes(market)||!intervals.has(interval)||!symbol||!/^[A-Z0-9]{2,40}USDT$/.test(symbol))return send(res,400,{error:'Parameter tidak valid'});
if(market==='futures'){
 try{const available=await futuresCatalog();if(!available.symbols.includes(symbol))return send(res,422,{error:symbol+' tidak tersedia pada OKX USDT Perpetual. Pilih pasangan Futures lain.'})}
 catch(e){return send(res,503,{error:'Tidak dapat memverifikasi daftar kontrak Futures',details:e.message})}
}else if(!symbols.has(symbol)&&!(catalogCache&&catalogCache.symbols.includes(symbol)))return send(res,422,{error:'Pasangan Spot tidak terdaftar'});
let live=url.pathname==='/api/live-candle';let key=`${market}:${symbol}:${interval}`,cached=cache.get(key);if(cached&&Date.now()-cached.time<(live?4000:30000))return send(res,200,{rows:live?cached.rows.slice(-2):cached.rows,source:cached.source,cached:true,updatedAt:cached.time});let failures=[];for(let [name,target,convert] of providers(market,symbol,interval)){try{let rows=convert(await request(target));cache.set(key,{rows,source:name,time:Date.now()});console.log(`Data OK ${market} ${symbol} via ${name}`);return send(res,200,{rows:live?rows.slice(-2):rows,source:name,cached:false,updatedAt:Date.now()})}catch(e){failures.push(name+': '+e.message);console.warn('Data provider failed:',market,name,e.message)}}if(cached&&Date.now()-cached.time<(live?300000:300000))return send(res,200,{rows:live?cached.rows.slice(-2):cached.rows,source:cached.source,cached:true,stale:true,updatedAt:cached.time});console.error('All providers failed',market,symbol,failures.join(' | '));return send(res,502,{error:'Semua penyedia gagal; cek Deploy Logs',details:failures})}).listen(port,'0.0.0.0',()=>console.log('CryptoSignal v3.9 listening on '+port));
