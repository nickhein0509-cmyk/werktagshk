import {normalizeLocation,sha256} from '../assistance/core.mjs';
import {validateNativeBatch} from '../assistance/native.mjs';
import {nativeQuery, MAX_JOURNEY_POINTS, MAX_NATIVE_RESPONSE_BYTES} from './query.mjs';
import {berlinDay} from '../assistance/domain.mjs';
const response=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','referrer-policy':'no-referrer'}});
export function createNativeHandler({store,installationId,now=()=>Date.now()}){
 return async req=>{
  try{
   const {action,date,deviceId}=nativeQuery(new URL(req.url),req.method);
   const h=req.headers.get('authorization');
   if(!h?.startsWith('Bearer ')||h.length>8192)return response(401,{error:'Anmeldung erforderlich.'});
   const user=await store.getUser(h.slice(7));
   if(!user?.id||user.is_anonymous)return response(401,{error:'Anmeldung erforderlich.'});
   const installation=await store.installation(installationId);
   if(!installation||installation.owner_user_id!==user.id)return response(403,{error:'Konto nicht mit dieser Assistenz verbunden.'});
   if(action==='status')return response(200,{schemaVersion:1,linked:true,userId:user.id});
   if(action==='health')return response(200,{schemaVersion:1,days:await store.nativeHealth(installationId)});
   if(action==='journey'){
    const rows=await store.nativeJourney(installationId,date,deviceId,MAX_JOURNEY_POINTS+1,user.id);
    if(rows.length>MAX_JOURNEY_POINTS)return response(413,{error:'Dieser Tag enthält zu viele Messpunkte. Bitte den Verlauf in WerkTag öffnen.'});
    // Verify the store boundary before returning any personal coordinates.
    if(rows.some(p=>p.source!=='werktag_ios'||p.device!==deviceId||berlinDay(p.tst)!==date))throw Error('Journey scope mismatch');
    const points=rows.map(({id,tst,lat,lon,acc,alt,vel,cog,receivedAt,source,device})=>({id,tst,lat,lon,acc,alt,vel,cog,receivedAt,source,device}));
    points.sort((a,b)=>a.tst-b.tst||a.receivedAt.localeCompare(b.receivedAt)||a.id.localeCompare(b.id));
    const body={schemaVersion:1,date,timeZone:'Europe/Berlin',source:'werktag_ios',deviceId,points,totalSelected:points.length,truncated:false};
    if(new TextEncoder().encode(JSON.stringify(body)).length>MAX_NATIVE_RESPONSE_BYTES)return response(413,{error:'Dieser Tag ist für die App zu groß. Bitte den Verlauf in WerkTag öffnen.'});
    return response(200,body);
   }
   if((req.headers.get('content-type')??'').split(';')[0].trim()!=='application/json'||(req.headers.has('content-encoding')&&req.headers.get('content-encoding')!=='identity'))return response(415,{error:'JSON erwartet.'});
   let size=0;const pieces=[];if(req.body)for await(const p of req.body){size+=p.length;if(size>262144)return response(413,{error:'Anfrage zu groß.'});pieces.push(p);}
   const bytes=new Uint8Array(size);let offset=0;for(const p of pieces){bytes.set(p,offset);offset+=p.length;}
   let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return response(400,{error:'Ungültiges JSON.'});}
   const rows=await validateNativeBatch(body,{now:now(),normalizeLocation,sha256});
   const result=await store.nativeIngest(installationId,user.id,rows);
   if(result?.conflict)return response(409,{error:'Ereignis-ID mit anderen Daten belegt.'});
   return response(200,result);
  }catch(e){return response([400,405].includes(e.status)?e.status:503,{error:e.status===400?'Ungültige Daten.':e.status===405?'Anfrage nicht unterstützt.':'WerkTag ist vorübergehend nicht erreichbar.'});}
 };
}
