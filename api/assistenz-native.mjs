import {Buffer} from 'node:buffer';
const send=(res,status,body)=>{res.statusCode=status;res.end(JSON.stringify(body));};
export function createNativeGateway({env=process.env,fetchImpl=fetch}={}){
 return async(req,res)=>{
  for(const [k,v] of Object.entries({'Cache-Control':'no-store','Content-Type':'application/json','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}))res.setHeader(k,v);
  const action=req.query?.action??new URL(req.url,'https://werk-tag.com').searchParams.get('action');
  if(action==='config'&&req.method==='GET'){
   const url=env.VITE_SUPABASE_URL,key=env.VITE_SUPABASE_PUBLISHABLE_KEY;
   if(!url||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)||!key||key.startsWith('sb_secret_'))return send(res,503,{error:'App-Verbindung noch nicht eingerichtet.'});
   if(!key.startsWith('sb_publishable_')){try{if(JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role!=='anon')throw Error();}catch{return send(res,503,{error:'Öffentliche App-Konfiguration fehlt.'});}}
   return send(res,200,{schemaVersion:1,supabaseURL:url,publishableKey:key});
  }
  if(({status:'GET',health:'GET',ingest:'POST'})[action]!==req.method)return send(res,405,{error:'Anfrage nicht unterstützt.'});
  const auth=req.headers.authorization;
  if(typeof auth!=='string'||auth.length>8192||!/^Bearer [A-Za-z0-9._-]+$/.test(auth))return send(res,401,{error:'Anmeldung erforderlich.'});
  let endpoint;
  try{endpoint=new URL(env.ASSISTANCE_NATIVE_URL);if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||!/^\/functions\/v1\/[a-z0-9-]+$/.test(endpoint.pathname))throw Error();}
  catch{return send(res,503,{error:'Native Verbindung noch nicht eingerichtet.'});}
  endpoint.searchParams.set('action',action);
  try{
   let body;
   if(req.method==='POST'){
    if((req.headers['content-type']??'').split(';')[0].trim()!=='application/json'||(req.headers['content-encoding']&&req.headers['content-encoding']!=='identity'))return send(res,415,{error:'JSON erwartet.'});
    if(req.body!==undefined){body=Buffer.isBuffer(req.body)?req.body:Buffer.from(typeof req.body==='string'?req.body:JSON.stringify(req.body));}
    else{const parts=[];let size=0;for await(const p of req){size+=p.length;if(size>262144)return send(res,413,{error:'Anfrage zu groß.'});parts.push(Buffer.from(p));}body=Buffer.concat(parts);}
    if(body.length>262144)return send(res,413,{error:'Anfrage zu groß.'});
   }
   const result=await fetchImpl(endpoint,{method:req.method,headers:{authorization:auth,'content-type':'application/json'},body,redirect:'manual',signal:AbortSignal.timeout(20000)});
   if(result.status>=300&&result.status<400)throw Error();
   if(!(result.headers.get('content-type')??'').includes('application/json'))throw Error();
   const parts=[];let size=0;
   if(result.body)for await(const p of result.body){size+=p.length;if(size>1048576)throw Error();parts.push(Buffer.from(p));}
   const retry=result.headers.get('retry-after');if(retry)res.setHeader('Retry-After',retry);
   res.statusCode=result.status;res.end(Buffer.concat(parts));
  }catch{return send(res,502,{error:'WerkTag ist vorübergehend nicht erreichbar. Deine Daten bleiben auf dem iPhone.'});}
 };
}
export default createNativeGateway();
