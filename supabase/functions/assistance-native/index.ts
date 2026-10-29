import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {createNativeHandler} from './handler.mjs';
const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const installationId=Deno.env.get('ASSISTANCE_INSTALLATION_ID');
if(!installationId)throw new Error('ASSISTANCE_INSTALLATION_ID required');
const check=(r:any)=>{if(r.error)throw new Error('Database operation failed');return r.data;};
const store={
 async getUser(token:string){const r=await admin.auth.getUser(token);return r.error?null:r.data.user;},
 async installation(id:string){return check(await admin.from('assistance_installations').select('owner_user_id').eq('id',id).maybeSingle());},
 async nativeHealth(id:string){return check(await admin.from('assistance_native_health_days').select('device_id,date,captured_at,received_at,payload').eq('installation_id',id).order('date',{ascending:false}).limit(90));},
 async nativeJourney(id:string,date:string,deviceId:string,limit:number,userId:string){
  return check(await admin.rpc('assistance_native_journey',{p_installation_id:id,p_user_id:userId,p_date:date,p_device_id:deviceId,p_limit:limit}));
 },
 async nativeIngest(id:string,userId:string,events:any[]){
  const r=await admin.rpc('assistance_native_ingest',{p_installation_id:id,p_user_id:userId,p_events:events});
  if(r.error?.message?.includes('NATIVE_ID_CONFLICT'))return {conflict:true};
  return check(r);
 }
};
Deno.serve(createNativeHandler({store,installationId}));
