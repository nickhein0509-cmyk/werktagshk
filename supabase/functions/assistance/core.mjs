import {selectPoints,berlinDay,healthView,validateHealthDay,emptyContext,updateContextValue,validateContextValue,contextView,validateContextRange,contextRange,statisticsFromData,gpxForDay} from './domain.mjs';
import {cataloguePath,catalogueResponse,catalogueUnauthorized,validateCatalogueResource} from './catalog.mjs';
import {recorderCount,validateRecorderSelection} from './semantics/recorders.js';
export const COOKIE='__Secure-werktag-assistance';
const MSG=new Set(['location','status','transition','waypoint','waypoints','steps','beacon','card','lwt','cmd','request','encrypted']);
const enc=new TextEncoder();
export const sha256=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
export const hashSecret=(salt,value)=>sha256(salt+':'+value);
const safeEqual=(a,b)=>{if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0;};
const error=(status,message)=>{throw Object.assign(new Error(message),{status});};
const dateOK=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const iso=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v);
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
export async function normalizeLocation(payload,source,device,now=Date.now()){
 if(!payload||typeof payload!=='object'||Array.isArray(payload)||typeof payload._type!=='string')error(400,'Expected an OwnTracks object.');
 if(payload._type!=='location')return null;
 if(!Number.isSafeInteger(payload.tst)||payload.tst<946684800||payload.tst>Math.floor(now/1000)+86400)error(400,'Invalid source timestamp.');
 if(!Number.isFinite(payload.lat)||Math.abs(payload.lat)>90||!Number.isFinite(payload.lon)||Math.abs(payload.lon)>180)error(400,'Invalid coordinates.');
 if(typeof source!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(source)||typeof device!=='string'||!device.length||device.length>256||/[\r\n\0]/.test(device))error(400,'Invalid source or device.');
 const row={source,device,tst:payload.tst,lat:payload.lat,lon:payload.lon};
 for(const key of ['acc','alt','vel','cog','batt'])if(payload[key]!==undefined){const v=payload[key];if(!Number.isFinite(v)||(['acc','vel'].includes(key)&&v<0)||(key==='batt'&&(v<0||v>100)))error(400,'Invalid location metadata.');row[key]=v;}
 if(payload.tid!==undefined){if(typeof payload.tid!=='string'||payload.tid.length>16)error(400,'Invalid tracker identifier.');row.tid=payload.tid;}
 row.id=await sha256(JSON.stringify([source,device,row.tst,row.lat,row.lon]));return row;
}
async function parseBody(req,max=65536){
 if((req.headers.get('content-type')??'').split(';')[0].trim().toLowerCase()!=='application/json')error(415,'JSON erwartet.');
 if(req.headers.has('content-encoding')&&req.headers.get('content-encoding')!=='identity')error(415,'Komprimierte Anfragen werden nicht unterstützt.');
 const length=req.headers.get('content-length');if(length!==null&&(!/^\d+$/.test(length)||Number(length)>max))error(413,'Anfrage zu groß.');
 const reader=req.body?.getReader();if(!reader)error(400,'JSON erwartet.');const parts=[];let bytes=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>max){await reader.cancel();error(413,'Anfrage zu groß.');}parts.push(value);}}
 finally{reader.releaseLock();}
 const all=new Uint8Array(bytes);let at=0;for(const p of parts){all.set(p,at);at+=p.length;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));}catch{error(400,'Ungültige JSON-Daten.');}
}
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const limitedKeys=(value,keys)=>{if(!object(value)||Object.keys(value).some(k=>!keys.includes(k)))error(400,'Ungültige Anfrage.');};
const cookieValue=req=>(req.headers.get('cookie')??'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
const cookie=(token,age=604800)=>`${COOKIE}=${token}; Path=/assistenz; Max-Age=${age}; Secure; HttpOnly; SameSite=Strict`;
const reply=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin',...extra}});
function query(url,allowed){if([...url.searchParams.keys()].some(k=>k!=='route'&&(!allowed.includes(k)||url.searchParams.getAll(k).length!==1)))error(400,'Ungültige Anfrage.');if(url.searchParams.getAll('route').length!==1)error(400,'Ungültige Route.');}
const recorderQuery=url=>validateRecorderSelection({source:url.searchParams.get('source')??undefined,device:url.searchParams.get('device')??undefined})??{};
export function createAssistance({store,installationId,publicOrigin='https://werk-tag.com',now=()=>Date.now()}){
 const origin=req=>{if(req.headers.get('origin')!==publicOrigin||req.headers.get('sec-fetch-site')==='cross-site')error(403,'Ungültiger Ursprung.');};
 const verify=async (installation,secret,field)=>typeof secret==='string'&&secret.length<=512&&safeEqual(await hashSecret(installation.salt,secret),installation[field]);
 const identity=async req=>{const h=req.headers.get('authorization');if(!h?.startsWith('Bearer '))error(401,'Anmeldung erforderlich.');const user=await store.getUser(h.slice(7));if(!user?.id||user.is_anonymous===true)error(401,'Anmeldung erforderlich.');return user;};
 async function session(req,installation){const token=cookieValue(req);if(!token||!/^[0-9a-f]{64}$/.test(token))return null;const s=await store.session(installationId,await sha256(token));if(!s||Date.parse(s.valid_until)<=now())return null;if(s.account_user_id&&s.account_user_id!==installation.owner_user_id)return null;return {...s,token,canWrite:Date.parse(s.owner_until)>now(),accountBound:!!s.account_user_id};}
 async function newSession(installation,userId=null,owner=false){const token=randomToken();await store.putSession({installation_id:installationId,token_hash:await sha256(token),valid_until:new Date(now()+7*86400000).toISOString(),owner_until:owner?new Date(now()+8*3600000).toISOString():null,account_user_id:userId});return token;}
 async function mapSession(req,installation){const s=await session(req,installation);if(!s)error(401,'Öffne deinen persönlichen Kartenlink oder melde dich an.');return s;}
 async function csrf(req,s){origin(req);if(!s.canWrite||!safeEqual(req.headers.get('x-csrf-token'),await sha256('csrf:'+s.token)))error(403,'Schreibfreigabe erforderlich.');}
 async function manualView(value,date){
 // A saved note or task must not depend on the availability of GPS history.
 // References stay explicitly unverified when their optional journal is absent.
 if(!value.entries.some(entry=>entry.kind==='activity'&&entry.segmentRef))return contextView(value,null);
 try{const points=await store.points(installationId);return contextView(value,recorderCount(points.filter(p=>berlinDay(p.tst)===date))>1?null:selectPoints(points,date,Number.MAX_SAFE_INTEGER).journal);}
 catch{return contextView(value,null);}
 }
 async function archiveCompleted(points,known){
 const today=berlinDay(now()/1000),present=new Set(known.map(a=>a.date)),ordered=[...points].sort((a,b)=>a.tst-b.tst||a.receivedAt.localeCompare(b.receivedAt)),deferredDates=[];
 for(const date of [...new Set(ordered.map(p=>berlinDay(p.tst)))].filter(d=>d<today&&!present.has(d))){
 const selected=ordered.filter(p=>berlinDay(p.tst)===date);
 // Archive v1 contains one journal for the entire day. Persisting mixed devices
 // would either invent connecting legs or silently omit a source. Until a
 // versioned multi-recorder archive exists, retain all raw points live instead.
 if(recorderCount(selected)>1){deferredDates.push(date);continue;}
 const journal=selectPoints(ordered,date,Number.MAX_SAFE_INTEGER).journal,stamp=new Date(now()).toISOString();
 const contentHash=await sha256(JSON.stringify({points:selected,journal}));
 const payload={schemaVersion:1,date,revision:1,pointCount:selected.length,tripCount:journal.trips.length,stayCount:journal.stays.length,firstTimestamp:selected[0].tst,lastTimestamp:selected.at(-1).tst,archivedAt:stamp,updatedAt:stamp,contentHash,timeZone:'Europe/Berlin',journal,points:selected};
 await store.ensureArchive(installationId,date,payload,gpxForDay(date,selected));
 }
 return {archives:await store.archives(installationId),deferredDates};
 }
 return async req=>{
 let isPub=false;
 try{
 const url=new URL(req.url),route=url.searchParams.get('route');if(!route)error(404,'Nicht gefunden.');isPub=route==='pub';
 const install=await store.installation(installationId);if(!install)error(503,'Assistenz vorübergehend nicht verfügbar.');
 if(route==='health'&&req.method==='GET'){query(url,[]);return reply({ok:true});}
 if(route==='pub'){
 query(url,[]);if(req.method!=='POST')error(405,'Method not allowed.');
 let username,password;try{const h=req.headers.get('authorization');if(!/^Basic [A-Za-z0-9+/]+=*$/.test(h??''))throw 0;const decoded=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(h.slice(6)),c=>c.charCodeAt(0))),at=decoded.indexOf(':');if(at<1)throw 0;username=decoded.slice(0,at);password=decoded.slice(at+1);}catch{error(401,'Authentication required.');}
 if(!await verify(install,username,'username_hash')||!await verify(install,password,'password_hash'))error(401,'Authentication required.');
 const payload=await parseBody(req),device=req.headers.get('x-limit-d')??payload?.topic??payload?.tid??'iphone';
 if(typeof device!=='string'||!device.length||device.length>256||/[\r\n\0]/.test(device))error(400,'Invalid device identifier.');
 const row=await normalizeLocation(payload,username,device,now());
 await store.ingest(installationId,row,MSG.has(payload._type)?payload._type:'other');return reply([]);
 }
 if(route==='account/status'&&req.method==='GET'){
 query(url,[]);const user=await identity(req);return reply({authenticated:true,linked:install.owner_user_id===user.id,canRead:install.owner_user_id===user.id,claimed:!!install.owner_user_id,installationId:install.owner_user_id===user.id?installationId:null});
 }
 if(route==='account/claim'&&req.method==='POST'){
 query(url,[]);origin(req);const user=await identity(req),body=await parseBody(req,2048);limitedKeys(body,['ownerKey']);
 if(!await verify(install,body.ownerKey,'owner_hash'))error(403,'Besitzerfreigabe ungültig.');
 if(!await store.claim(installationId,user.id))error(409,'Diese Assistenz ist bereits einem anderen Profil zugeordnet.');
 const token=await newSession({...install,owner_user_id:user.id},user.id,true);return reply({ok:true,linked:true,accountBound:true},200,{'Set-Cookie':cookie(token)});
 }
 if(route==='account/session'&&req.method==='POST'){
 query(url,[]);origin(req);const user=await identity(req);if(install.owner_user_id!==user.id)error(403,'Dein Profil ist noch nicht mit dieser Assistenz verbunden.');
 const token=await newSession(install,user.id,true);return reply({ok:true,linked:true,accountBound:true},200,{'Set-Cookie':cookie(token)});
 }
 if(route==='map/auth'&&req.method==='POST'){
 query(url,[]);origin(req);const body=await parseBody(req,1024);limitedKeys(body,['key']);if(!await verify(install,body.key,'map_hash'))error(401,'Kartenlink ungültig.');const token=await newSession(install);return reply({ok:true},200,{'Set-Cookie':cookie(token)});
 }
 if(route==='map/logout'&&req.method==='POST'){
 query(url,[]);origin(req);const token=cookieValue(req);if(token&&/^[0-9a-f]{64}$/.test(token))await store.deleteSession(installationId,await sha256(token));return reply({ok:true},200,{'Set-Cookie':cookie('',0)});
 }
 if(route==='import'&&req.method==='POST'){
 query(url,[]);const body=await parseBody(req,2*1024*1024);limitedKeys(body,['ownerToken','points','health','contexts','archives']);if(!await verify(install,body.ownerToken,'owner_hash'))error(403,'Besitzerfreigabe ungültig.');
 const data={};for(const name of ['points','health','contexts','archives']){if(body[name]!==undefined&&(!Array.isArray(body[name])||body[name].length>1000))error(400,'Ungültiger Import.');data[name]=body[name]??[];}
 for(const p of data.points){if(!object(p)||!iso(p.receivedAt))error(400,'Ungültiger Standortimport.');const checked=await normalizeLocation({...p,_type:'location'},p.source,p.device,now());if(checked.id!==p.id)error(400,'Ungültige Standort-ID.');}
 for(const h of data.health)validateHealthDay(h,h.date);
 for(const c of data.contexts)validateContextValue(c,c.date);
 for(const a of data.archives){limitedKeys(a,['date','json','gpx']);if(!dateOK(a.date)||typeof a.json!=='string'||typeof a.gpx!=='string')error(400,'Ungültiges Archiv.');let parsed;try{parsed=JSON.parse(a.json);}catch{error(400,'Ungültiges Archiv.');}if(parsed?.schemaVersion!==1||parsed.date!==a.date||parsed.timeZone!=='Europe/Berlin'||!Array.isArray(parsed.points)||!parsed.journal||!Number.isInteger(parsed.revision)||parsed.revision<1)error(400,'Ungültiges Archiv.');if(await sha256(JSON.stringify({points:parsed.points,journal:parsed.journal}))!==parsed.contentHash)error(400,'Ungültiger Archiv-Hash.');for(const p of parsed.points){const checked=await normalizeLocation({...p,_type:'location'},p.source,p.device,now());if(checked.id!==p.id||!iso(p.receivedAt)||berlinDay(p.tst)!==a.date)error(400,'Ungültiger Archivstandort.');}}
 return reply({ok:true,...await store.import(installationId,data)});
 }
 if(route==='import-catalog'&&req.method==='POST'){
 query(url,[]);const body=await parseBody(req,2*1024*1024);limitedKeys(body,['ownerToken','path','body','contentType','sha256','sourceSha256']);
 if(!await verify(install,body.ownerToken,'owner_hash'))error(403,'Besitzerfreigabe ungültig.');
 const value=await validateCatalogueResource(body),result=await store.importCatalogue(installationId,value);
 if(result?.conflict)error(409,'Dieser Katalogteil ist bereits mit anderem Inhalt gespeichert.');
 return reply({ok:true,...result});
 }
 if(route==='map/components'||route.startsWith('map/components/')){
 query(url,[]);const path=cataloguePath(route);if(!path)error(404,'Nicht gefunden.');
 if(!['GET','HEAD'].includes(req.method))error(405,'Nur lesender Zugriff ist erlaubt.');
 try{await mapSession(req,install);}catch(e){if(e.status===401&&path==='index.html')return catalogueUnauthorized(req.method);throw e;}
 const row=await store.catalogueResource(installationId,path);
 return await catalogueResponse(row,path,req.method);
 }
 const s=await mapSession(req,install);
 if(route==='map/session'&&req.method==='GET'){query(url,[]);return reply({canRead:true,canWrite:s.canWrite,csrfToken:s.canWrite?await sha256('csrf:'+s.token):null,accountBound:s.accountBound});}
 if(route==='map/owner'&&req.method==='POST'){query(url,[]);origin(req);const body=await parseBody(req,1024);limitedKeys(body,['token']);if(!await verify(install,body.token,'owner_hash'))error(403,'Schreibfreigabe ungültig.');await store.updateSession(installationId,s.token_hash,{owner_until:new Date(now()+8*3600000).toISOString()});return reply({ok:true});}
 if(route==='map/context'&&req.method==='POST'){
 query(url,[]);await csrf(req,s);const body=await parseBody(req);const previous=await store.context(installationId,body.date)??emptyContext(body.date),next=updateContextValue(previous,body,new Date(now()).toISOString());
 if(JSON.stringify(previous)!==JSON.stringify(next)&&!await store.writeContext(installationId,body.date,previous.revision,next))error(409,'Der Tag wurde inzwischen geändert. Bitte neu laden.');
 return reply(await manualView(next,body.date));
 }
 if(req.method!=='GET')error(405,'Methode nicht unterstützt.');
 if(route==='map/data'){
 query(url,['date','source','device']);const selection=recorderQuery(url),date=url.searchParams.get('date')??berlinDay(now()/1000);if(date!=='all'&&!dateOK(date))error(400,'Ungültiges Datum.');
 const [points,health,knownArchives,ingestion]=await Promise.all([store.points(installationId),store.health(installationId),store.archives(installationId),store.receipts(installationId)]);
 const view=selectPoints(points,date,20000,selection),{archives,deferredDates}=await archiveCompleted(points,knownArchives);
 const olderDates=[];const days=archives.map(a=>{const {date,pointCount,tripCount,stayCount,revision,updatedAt}=a.payload;const current=points.filter(p=>berlinDay(p.tst)===date).sort((a,b)=>a.tst-b.tst||a.receivedAt.localeCompare(b.receivedAt)),journal=selectPoints(points,date,Number.MAX_SAFE_INTEGER).journal,multipleRecorders=recorderCount(current)>1;const archiveSnapshotOlder=multipleRecorders||JSON.stringify(current.map(p=>p.id))!==JSON.stringify(a.payload.points.map(p=>p.id))||JSON.stringify(journal)!==JSON.stringify(a.payload.journal);if(archiveSnapshotOlder)olderDates.push(date);return{date,pointCount,tripCount,stayCount,revision,updatedAt,archiveSnapshotOlder,multipleRecorders,livePointCount:current.length};});
 return reply({...view,health:healthView(health,date),archive:{enabled:true,days,status:{ok:true,mode:'on-demand',checkedAt:new Date(now()).toISOString(),archiveSnapshotOlder:olderDates.length>0,olderDates,deferredDates}},ingestion:ingestion??null,refreshedAt:new Date(now()).toISOString()});
 }
 if(route==='map/context'){query(url,['date']);const date=url.searchParams.get('date');if(!dateOK(date))error(400,'Ungültiges Datum.');const value=await store.context(installationId,date)??emptyContext(date);validateContextValue(value,date);return reply(await manualView(value,date));}
 if(route==='map/context-range'){query(url,['from','to']);const {from,to}=validateContextRange(url.searchParams.get('from'),url.searchParams.get('to'));return reply(contextRange(await store.contexts(installationId,from,to),from,to));}
 if(route==='map/statistics'){
 query(url,['from','to','bucket','source','device']);const selection=recorderQuery(url);
 const [points,healthDays,contexts,knownArchives]=await Promise.all([store.points(installationId),store.health(installationId),store.contexts(installationId),store.archives(installationId)]);
 const input={points,healthDays,contexts,from:url.searchParams.get('from')??undefined,to:url.searchParams.get('to')??undefined,bucket:url.searchParams.get('bucket')??'day',now:now(),...selection};
 // Compute/validate once before this read can create any completed-day archive.
 // A newly archived day is already represented by the same live-derived data.
 const statistics=statisticsFromData({...input,archives:knownArchives.map(a=>a.payload)});
 const {deferredDates}=await archiveCompleted(points,knownArchives);
 return reply({...statistics,archive:{deferredDates}});
 }
 if(route==='map/archive'){
 query(url,['date','format']);const date=url.searchParams.get('date'),format=url.searchParams.get('format')??'gpx';if(!dateOK(date)||!['gpx','json'].includes(format))error(400,'Ungültiges Archivdatum.');let saved=await store.archive(installationId,date);if(!saved){await archiveCompleted(await store.points(installationId),await store.archives(installationId));saved=await store.archive(installationId,date);}if(!saved)error(404,'Dieser Tag ist noch nicht archiviert.');
 const body=format==='gpx'?(saved.gpx??gpxForDay(date,saved.payload.points)):JSON.stringify({...saved.payload,health:healthView(await store.health(installationId),date)},null,2)+'\n';return new Response(body,{headers:{'Content-Type':format==='gpx'?'application/gpx+xml; charset=utf-8':'application/json; charset=utf-8','Cache-Control':'no-store','Content-Disposition':`attachment; filename="Nick-GPS-${date}.${format}"`}});
 }
 error(404,'Nicht gefunden.');
 }catch(e){const status=[400,401,403,404,405,409,413,415,422,429].includes(e.status??e.statusCode)?e.status??e.statusCode:503;return reply({error:status===503?'Assistenz vorübergehend nicht verfügbar.':e.message},status,status===401&&isPub?{'WWW-Authenticate':'Basic realm="GPS ingestion", charset="UTF-8"'}:{});}
 };
}
