import {normalizeLocation,sha256} from '../assistance/core.mjs';
import {validateNativeBatch} from '../assistance/native.mjs';
const response=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','referrer-policy':'no-referrer'}});
export function createNativeHandler({store,installationId,now=()=>Date.now()}){
 return async req=>{
  try{
   const url=new URL(req.url),action=url.searchParams.get('action');
   if([...url.searchParams.keys()].some(k=>k!=='action')||url.searchParams.getAll('action').length!==1)return response(400,{error:'Ungültige Anfrage.'});
   if(({status:'GET',health:'GET',ingest:'POST'})[action]!==req.method)return response(405,{error:'Anfrage nicht unterstützt.'});
   const h=req.headers.get('authorization');
   if(!h?.startsWith('Bearer ')||h.length>8192)return response(401,{error:'Anmeldung erforderlich.'});
   const user=await store.getUser(h.slice(7));
   if(!user?.id||user.is_anonymous)return response(401,{error:'Anmeldung erforderlich.'});
   const installation=await store.installation(installationId);
   if(!installation||installation.owner_user_id!==user.id)return response(403,{error:'Konto nicht mit dieser Assistenz verbunden.'});
   if(action==='status')return response(200,{schemaVersion:1,linked:true,userId:user.id});
   if(action==='health')return response(200,{schemaVersion:1,days:await store.nativeHealth(installationId)});
   if((req.headers.get('content-type')??'').split(';')[0].trim()!=='application/json'||(req.headers.has('content-encoding')&&req.headers.get('content-encoding')!=='identity'))return response(415,{error:'JSON erwartet.'});
   let size=0;const pieces=[];if(req.body)for await(const p of req.body){size+=p.length;if(size>262144)return response(413,{error:'Anfrage zu groß.'});pieces.push(p);}
   const bytes=new Uint8Array(size);let offset=0;for(const p of pieces){bytes.set(p,offset);offset+=p.length;}
   let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return response(400,{error:'Ungültiges JSON.'});}
   const rows=await validateNativeBatch(body,{now:now(),normalizeLocation,sha256});
   const result=await store.nativeIngest(installationId,user.id,rows);
   if(result?.conflict)return response(409,{error:'Ereignis-ID mit anderen Daten belegt.'});
   return response(200,result);
  }catch(e){return response(e.status===400?400:503,{error:e.status===400?'Ungültige Daten.':'Speicherung vorübergehend nicht möglich.'});}
 };
}
