import { Buffer } from 'node:buffer';
import { cloudProxy } from '../server/assistance-cloud.mjs';

const files = ['app-v4.js','app-v4.css','app-v3.js','app-v3.css','app-v2.js','app-v2.css','app.js','app.css','route.js','health-v2.js','health-v2.css','health-v1.js','health-v1.css','statistics-v1.js','context-v1.js','vendor/leaflet.js','vendor/leaflet.css'];
const reads = new Set(['/map','/map/','/map/data','/map/archive','/map/statistics','/map/context','/map/context-range','/map/session',...files.map(f=>'/map/'+f)]);
const componentFiles = ['app.js','inflate.js','style-0.css','style-1.css','chrome.css','blocks/shk-offline-index.b64',...Array.from({length:42},(_,i)=>`blocks/shk-shard-${i}.b64`)];
const componentReads = new Set(['/map/components',...componentFiles.map(f=>'/map/components/'+f)]);
const writes = new Set(['/map/auth','/map/logout','/map/owner','/map/context']);
const cookies = new Set(['__Secure-nick-map','__Secure-nick-map-owner']);
const MAX_BODY = 262144;
const MAX_RESPONSE = 4 * 1024 * 1024;
export const config = { maxDuration: 30 };

export function onlyMapCookies(value = '') {
  return value.split(';').map(s=>s.trim()).filter(s=>cookies.has(s.slice(0,s.indexOf('=')))).join('; ');
}
export function rewriteCookie(value) {
  if (!cookies.has(value.slice(0,value.indexOf('=')))) return null;
  return value.replace(/;\s*Path=\/map(?=;|$)/i,'; Path=/assistenz');
}
export function rewriteAsset(text) {
  return text.replaceAll('/map','/assistenz');
}
function json(res,status,data) {
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}
function error(res,status,message,isPage,title='AI Assistance') {
  if (!isPage) return json(res,status,{error:message});
  res.statusCode=status;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end('<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>'+title+' · WerkTag</title><body style="background:#102e2d;color:#fff;font:18px system-ui;padding:2rem;max-width:42rem;margin:auto"><a style="color:#fff" href="/projekte">← Projekte</a><h1>'+title+'</h1><p>'+message+'</p><p>Der private Empfänger auf deinem PC muss laufen. Deine gespeicherten Daten bleiben dort erhalten.</p><a style="color:#fff" href="'+(title==='Komponentenliste'?'/assistenz/components':'/assistenz')+'">Erneut verbinden</a></body></html>');
}
function chrome(html,publicOrigin) {
  const head='<style>.wt-project-bar{display:flex;flex-wrap:wrap;gap:1rem;align-items:center;justify-content:space-between;background:#123e3c;color:#fff;padding:1rem max(1rem,calc((100vw - 1440px)/2));font:600 15px system-ui}.wt-project-bar a{color:#fff;min-height:44px;display:inline-flex;align-items:center}.wt-project-bar a:focus-visible{outline:3px solid #e6b796;outline-offset:4px}.wt-connection{padding:.8rem 1rem;background:#f5f1e8;color:#193c3a;font:15px/1.65 system-ui}.wt-connection summary{cursor:pointer;min-height:44px;display:list-item;padding:.5rem 0}.wt-connection code{overflow-wrap:anywhere}.wt-connection li{margin:.5rem 0}</style>';
  const nav=`<nav class="wt-project-bar" aria-label="Projekte"><a href="/projekte">WerkTag · Projekte</a><span>AI Assistance · privat</span><a href="/">Zum SHK Lernbuddy</a></nav>
<details class="wt-connection"><summary>OwnTracks verbinden</summary>
<p>Deine bestehende OwnTracks-Verbindung und deine Kurzbefehle weiterverwenden. Nur fehlende Einstellungen ändern.</p>
<ol>
<li>Vor einem Verbindungswechsel die OwnTracks-Version prüfen: mindestens <strong>27.0.1</strong>, empfohlen <strong>27.1.2</strong>. Seit 27.0.1 bleiben Warteschlange und Wegpunkte beim Wechsel erhalten. Ein App-Update erfolgt am iPhone über den App Store.</li>
<li>Im Modus <strong>HTTP</strong> die Zieladresse <code>${publicOrigin}/api/assistenz/owntracks</code> verwenden. HTTP-Authentifizierung eingeschaltet lassen und bisherigen Benutzernamen, HTTP-Passwort sowie Gerätekennung beibehalten. Stimmt die Adresse bereits, ist kein Import nötig.</li>
<li>Alternativ die <a href="/owntracks/WerkTag-OwnTracks.otrc" download>Konfiguration für die feste WerkTag-Adresse laden</a> und mit OwnTracks öffnen. Die Datei ändert nur die URL und enthält keine Zugangsdaten. Dafür unter <strong>Remote Control</strong> den Import über URL/Datei vorübergehend erlauben, im Vergleich nur die URL-Änderung bestätigen und die Importfreigabe danach wieder ausschalten.</li>
<li>Am iPhone Standortzugriff <strong>Immer</strong>, <strong>Genauer Standort</strong>, mobile Daten und Hintergrundaktualisierung für OwnTracks erlauben. Für eine dichte Strecke den vorhandenen <strong>Move</strong>-Modus verwenden.</li>
<li>Einmal den bestehenden Kurzbefehl <strong>Standort senden</strong> ausführen. Sein vorhandener <strong>Intent Auth Key</strong> bleibt getrennt vom HTTP-Passwort. Keine zweite Standortlösung nötig.</li>
</ol>
<p>Ein erfolgreicher Kurzbefehl oder Servercheck bestätigt noch keinen neuen iPhone-Standort. Dafür Quellzeit, Empfangszeit und Gerätekennung nach dem Senden abgleichen. Wiederholtes Senden desselben Punkts kann ohne neuen Eintrag bleiben.</p>
<p>PC, Empfänger und Tunnel müssen laufen. Die iPhone-Adresse bleibt fest; nach einem Wechsel der temporären PC-Tunneladresse muss die WerkTag-Verbindung zum PC aktualisiert werden.</p>
</details>`;
  return html.replace(/<title>[^<]*<\/title>/i,'<title>AI Assistance · WerkTag</title>').replace('</head>',head+'</head>').replace(/<body([^>]*)>/i,'<body$1>'+nav);
}
async function body(req) {
  if (req.body !== undefined && req.body !== null) {
    const b=Buffer.isBuffer(req.body)?req.body:Buffer.from(typeof req.body==='string'?req.body:JSON.stringify(req.body));
    if(b.length>MAX_BODY)throw Object.assign(new Error('Anfrage zu groß.'),{status:413});
    return b;
  }
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw Object.assign(new Error('Anfrage zu groß.'),{status:413});chunks.push(Buffer.from(chunk));}
  return Buffer.concat(chunks);
}
export function createGateway(options={}) {
  return async function gateway(req,res) {
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Frame-Options','DENY');
    let upstream;
    const publicOrigin=options.publicOrigin??process.env.ASSISTANCE_PUBLIC_ORIGIN??'https://werk-tag.com';
    const incoming=new URL(req.url??'/','https://werk-tag.com');
    const route=req.query?.path??incoming.searchParams.get('path')??(incoming.pathname==='/api/assistenz/owntracks'?'pub':incoming.pathname.replace(/^\/assistenz/,'map'));
    const isComponents=typeof route==='string'&&componentReads.has('/'+route);
    const isPage=route==='map'||route==='map/'||route==='map/components';
    const title=route==='map/components'?'Komponentenliste':'AI Assistance';
    if(typeof route!=='string'||route.includes('%')||route.includes('..')||route.includes('\\'))return json(res,404,{error:'Nicht gefunden.'});
    const targetPath='/'+route;
    if(process.env.ASSISTANCE_CLOUD_URL && !options.upstreamOrigin) return cloudProxy(req,res,route);
    const ingestion=targetPath==='/pub';
    if(ingestion?req.method!=='POST':!((req.method==='GET'&&(reads.has(targetPath)||componentReads.has(targetPath)))||(req.method==='POST'&&writes.has(targetPath))))return json(res,ingestion?405:404,{error:'Anfrage nicht unterstützt.'});
    if(!ingestion&&req.method==='POST') {
      if(req.headers.origin!==publicOrigin||req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'Ungültiger Ursprung.'});
    }
    try {
      upstream=new URL(options.upstreamOrigin??process.env.ASSISTANCE_UPSTREAM_ORIGIN??'');
      if(upstream.protocol!=='https:'||upstream.username||upstream.password||upstream.pathname!=='/'||upstream.search||upstream.hash)throw new Error();
    } catch {return error(res,503,'Die private Verbindung ist noch nicht eingerichtet.',isPage,title);}
    const target=new URL(targetPath,upstream);
    for(const [key,value] of incoming.searchParams){if(key!=='path')target.searchParams.append(key,value);}
    const headers={'accept-encoding':'identity'};
    for(const h of ['accept','content-type','x-csrf-token'])if(typeof req.headers[h]==='string')headers[h]=req.headers[h];
    if(ingestion && typeof req.headers.authorization==='string' && /^Basic [A-Za-z0-9+/]+=*$/i.test(req.headers.authorization))headers.authorization=req.headers.authorization;
    if(ingestion)for(const h of ['x-limit-d','x-limit-u','content-encoding'])if(typeof req.headers[h]==='string')headers[h]=req.headers[h];
    if(!ingestion){
      const selected=onlyMapCookies(req.headers.cookie);
      if(selected)headers.cookie=selected;
      if(req.method==='POST'){headers.origin=upstream.origin;headers['sec-fetch-site']='same-origin';}
    }
    try {
      const bytes=req.method==='POST'?await body(req):undefined;
      const response=await (options.fetchImpl??fetch)(target,{method:req.method,headers,body:bytes,redirect:'manual',signal:AbortSignal.timeout(20000)});
      if(response.status>=300&&response.status<400)return error(res,502,'Der private Empfänger ist gerade nicht erreichbar.',isPage,title);
      const chunks=[];let size=0;
      if(response.body)for await(const part of response.body){size+=part.length;if(size>MAX_RESPONSE){await response.body.cancel().catch(()=>{});throw new Error('Response too large');}chunks.push(Buffer.from(part));}
      let result=Buffer.concat(chunks);
      const type=response.headers.get('content-type')??'application/octet-stream';
      // Catalogue assets and compressed source blocks must remain byte-for-byte intact.
      if(!ingestion&&!isComponents&&/^(text\/(?:html|css|javascript)|application\/javascript)/i.test(type)){
        let content=rewriteAsset(result.toString('utf8'));
        if(isPage&&response.status===200)content=chrome(content,publicOrigin);
        result=Buffer.from(content);
      }
      for(const h of ['content-type','content-disposition','content-security-policy','www-authenticate','retry-after','x-werktag-archive-version']){const value=response.headers.get(h);if(value)res.setHeader(h,value);}
      const setCookies=response.headers.getSetCookie?.()??[];
      const filtered=setCookies.map(rewriteCookie).filter(Boolean);
      if(!ingestion&&filtered.length)res.setHeader('Set-Cookie',filtered);
      res.statusCode=response.status;res.end(result);
    }catch(e){return error(res,e.status??502,e.status===413?'Anfrage zu groß.':'Der private Empfänger ist gerade nicht erreichbar. Bitte prüfe den PC und versuche es erneut.',isPage,title);}
  };
}
export default createGateway();
