import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {createAssistance} from './core.mjs';
const supabaseUrl=Deno.env.get('SUPABASE_URL')!;
const admin=createClient(supabaseUrl,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const installationId=Deno.env.get('ASSISTANCE_INSTALLATION_ID')??'b4f2aa0a-c752-42f4-9b9d-10aecf7c9420';
const check=(result:any)=>{if(result.error)throw new Error('Database operation failed.');return result.data;};
async function all(table:string,id:string,columns='*',order='date',bounds?:{from:string,to:string}){
 const out:any[]=[];
 for(let offset=0;;offset+=1000){let query=admin.from('assistance_'+table).select(columns).eq('installation_id',id).order(order,{ascending:true}).range(offset,offset+999);if(bounds)query=query.gte(order,bounds.from).lte(order,bounds.to);const rows=check(await query);out.push(...rows);if(rows.length<1000)return out;if(out.length>2000000)throw new Error('Archive range too large.');}
}
const canonicalPoint=(p:any)=>{const out:any={source:p.source,device:p.device,tst:p.tst,lat:p.lat,lon:p.lon};for(const key of ['acc','alt','vel','cog','batt','tid','id','receivedAt'])if(p[key]!==undefined)out[key]=p[key];return out;};
const canonicalArchive=(a:any)=>({...a,payload:a.original_json?JSON.parse(a.original_json):a.payload});
const store={
 async installation(id:string){return check(await admin.from('assistance_installations').select('*').eq('id',id).maybeSingle());},
 async getUser(token:string){const result=await admin.auth.getUser(token);return result.error?null:result.data.user;},
 async session(id:string,hash:string){return check(await admin.from('assistance_sessions').select('*').eq('installation_id',id).eq('token_hash',hash).maybeSingle());},
 async putSession(value:any){check(await admin.from('assistance_sessions').insert(value));},
 async updateSession(id:string,hash:string,value:any){check(await admin.from('assistance_sessions').update(value).eq('installation_id',id).eq('token_hash',hash));},
 async deleteSession(id:string,hash:string){check(await admin.from('assistance_sessions').delete().eq('installation_id',id).eq('token_hash',hash));},
 async claim(id:string,userId:string){return check(await admin.rpc('assistance_claim',{p_installation_id:id,p_user_id:userId}));},
 async ingest(id:string,point:any,type:string){return check(await admin.rpc('assistance_ingest',{p_installation_id:id,p_point:point,p_message_type:type}));},
 async import(id:string,data:any){return check(await admin.rpc('assistance_import',{p_installation_id:id,p_data:data}));},
 async importCatalogue(id:string,value:any){return check(await admin.rpc('assistance_catalog_import',{p_installation_id:id,p_path:value.path,p_body:value.body,p_content_type:value.contentType,p_sha256:value.sha256,p_source_sha256:value.sourceSha256}));},
 async catalogueResource(id:string,path:string){return check(await admin.rpc('assistance_catalog_resource',{p_installation_id:id,p_path:path}));},
 async points(id:string){return check(await admin.rpc('assistance_read_points',{p_installation_id:id})).map(canonicalPoint);},
 async receipts(id:string){return check(await admin.from('assistance_receipts').select('payload').eq('installation_id',id).maybeSingle())?.payload??null;},
 async health(id:string){return (await all('health_days',id)).map(r=>r.payload);},
 async contexts(id:string,from?:string,to?:string){return (await all('contexts',id,'payload','date',from&&to?{from,to}:undefined)).map(r=>r.payload);},
 async context(id:string,date:string){return check(await admin.from('assistance_contexts').select('payload').eq('installation_id',id).eq('date',date).maybeSingle())?.payload??null;},
 async writeContext(id:string,date:string,revision:number,payload:any){return check(await admin.rpc('assistance_context_write',{p_installation_id:id,p_date:date,p_expected_revision:revision,p_payload:payload}));},
 async archives(id:string){return (await all('archives',id)).map(canonicalArchive);},
 async archive(id:string,date:string){const value=check(await admin.from('assistance_archives').select('*').eq('installation_id',id).eq('date',date).maybeSingle());return value?canonicalArchive(value):null;},
 async ensureArchive(id:string,date:string,payload:any,gpx:string){check(await admin.from('assistance_archives').upsert({installation_id:id,date,payload,gpx,original_json:JSON.stringify(payload,null,2)+'\n'},{onConflict:'installation_id,date',ignoreDuplicates:true}));},
};
const handler = createAssistance({store,installationId,publicOrigin:Deno.env.get('ASSISTANCE_PUBLIC_ORIGIN')??'https://werk-tag.com'});
Deno.serve(handler as (request: Request) => Promise<Response>);
