import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createNativeHandler} from './handler.mjs';
import {validateNativeBatch} from '../assistance/native.mjs';
import {normalizeLocation,sha256} from '../assistance/core.mjs';
import {createNativeGateway} from '../../../api/assistenz-native.mjs';
const now=Date.parse('2026-10-29T12:00:00Z'),owner='11111111-1111-4111-8111-111111111111',device='22222222-2222-4222-8222-222222222222';
const event=()=>({id:crypto.randomUUID(),kind:'location',capturedAt:'2026-10-29T11:59:00Z',location:{tst:Math.floor(now/1000)-60,lat:48,lon:8,acc:12}});
const batch=()=>({schemaVersion:1,deviceId:device,events:[event()]});
const validate=b=>validateNativeBatch(b,{now,normalizeLocation,sha256});
function fixture({user={id:owner},linked=owner,fail=false}={}){
 const stored=new Map();let calls=0;
 const store={getUser:async t=>t==='valid'?user:null,installation:async()=>({owner_user_id:linked}),nativeHealth:async()=>[],
 nativeIngest:async(i,u,rows)=>{calls++;if(fail)throw Error('sensitive database detail');for(const r of rows)if(stored.has(r.id)&&stored.get(r.id)!==r.hash)return {conflict:true};for(const r of rows)stored.set(r.id,r.hash);return {schemaVersion:1,accepted:rows.map(r=>r.id),receivedAt:'2026-10-29T12:00:00Z'};}};
 return {run:createNativeHandler({store,installationId:'test',now:()=>now}),stored,calls:()=>calls};
}
const req=(b,token='valid')=>new Request('https://example.com/?action=ingest',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify(b)});
test('valid measured location has canonical source and stable hash on retry',async()=>{
 const b=batch(),a=await validate(b),c=await validate(b);assert.deepEqual(a,c);assert.equal(a[0].payload.source,'werktag_ios');assert.equal(a[0].payload.device,device);
});
test('reordered health keys have same canonical hash and missing values are not zero',async()=>{
 const id=crypto.randomUUID(),b={schemaVersion:1,deviceId:device,events:[{id,kind:'health',capturedAt:'2026-10-29T12:00:00Z',health:{date:'2026-10-29',timezone:'Europe/Berlin',steps:120}}]};
 const first=await validate(b);b.events[0].health={steps:120,timezone:'Europe/Berlin',date:'2026-10-29'};
 assert.deepEqual(await validate(b),first);assert.equal('heartRateBpm' in first[0].payload,false);
});
test('reject invalid schema, UUID, unknown fields, oversized batches before storage',async()=>{
 for(const mutate of [b=>b.schemaVersion=2,b=>b.deviceId='bad',b=>b.secret='x',b=>b.events=[],b=>b.events=Array.from({length:101},event),b=>b.events.push(b.events[0])]){
  const b=batch();mutate(b);await assert.rejects(validate(b));
 }
});
test('reject invalid coordinates, timestamps, negative accuracy, ambiguous events',async()=>{
 for(const mutate of [e=>e.location.lat=91,e=>e.location.acc=-1,e=>delete e.location.acc,e=>e.location.tst=Math.floor(now/1000)+301,e=>e.capturedAt='no',e=>e.health={},e=>e.kind='calendar']){
  const b=batch();mutate(b.events[0]);await assert.rejects(validate(b));
 }
});
test('invalid health day, unit, value, and unknown keys rejected',async()=>{
 for(const health of [{date:'2026-02-30',timezone:'Europe/Berlin'},{date:'2026-10-29',timezone:'UTC'},{date:'2026-10-29',timezone:'Europe/Berlin',steps:-1},{date:'2026-10-29',timezone:'Europe/Berlin',steps:1.5},{date:'2026-10-29',timezone:'Europe/Berlin',heartRateBpm:999},{date:'2026-10-29',timezone:'Europe/Berlin',password:'x'}]){
  const b=batch();b.events=[{id:crypto.randomUUID(),kind:'health',capturedAt:'2026-10-29T12:00:00Z',health}];await assert.rejects(validate(b));
 }
});
test('missing/revoked token, anonymous and foreign owner never write',async()=>{
 for(const [f,token,status] of [[fixture(),'revoked',401],[fixture({user:{id:owner,is_anonymous:true}}),'valid',401],[fixture({linked:'someone-else'}),'valid',403]]){
  assert.equal((await f.run(req(batch(),token))).status,status);assert.equal(f.calls(),0);
 }
});
test('success and retry return exact durable IDs; changed payload conflicts',async()=>{
 const f=fixture(),b=batch();
 for(let i=0;i<2;i++){const r=await f.run(req(b));assert.equal(r.status,200);assert.deepEqual((await r.json()).accepted,b.events.map(e=>e.id));}
 assert.equal(f.stored.size,1);b.events[0].location.lon=9;assert.equal((await f.run(req(b))).status,409);
});
test('storage failure returns no acknowledgement or implementation details',async()=>{
 const f=fixture({fail:true}),r=await f.run(req(batch()));assert.equal(r.status,503);const b=await r.json();assert.equal(b.accepted,undefined);assert.doesNotMatch(JSON.stringify(b),/sensitive/);
});
test('oversized, invalid JSON, unknown method and cookie-only requests rejected',async()=>{
 const f=fixture();assert.equal((await f.run(new Request('https://a/?action=status',{headers:{cookie:'x=secret'}}))).status,401);
 assert.equal((await f.run(new Request('https://a/?action=ingest',{method:'POST',headers:{authorization:'Bearer valid','content-type':'application/json'},body:'x'.repeat(262145)}))).status,413);
 assert.equal((await f.run(new Request('https://a/?action=ingest',{method:'POST',headers:{authorization:'Bearer valid','content-type':'application/json'},body:'{'}))).status,400);assert.equal(f.calls(),0);
});
function res(){return {headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=v;}};}
test('gateway never exposes service role or secret config keys',async()=>{
 for(const key of ['sb_secret_danger','x.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.x']){
  const r=res();await createNativeGateway({env:{VITE_SUPABASE_URL:'https://test.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:key}})({url:'/?action=config',method:'GET',headers:{}},r);
  assert.equal(r.statusCode,503);assert.doesNotMatch(r.body,/danger|service_role/);
 }
});
test('gateway forwards only bearer to fixed native function, no cookie or arbitrary query',async()=>{
 let observed;const gateway=createNativeGateway({env:{ASSISTANCE_NATIVE_URL:'https://test.supabase.co/functions/v1/assistance-native'},fetchImpl:async(url,options)=>{observed={url:String(url),options};return new Response('{"schemaVersion":1}',{headers:{'content-type':'application/json'}});}});
 const r=res();await gateway({url:'/?action=status&target=evil',method:'GET',headers:{authorization:'Bearer valid',cookie:'owner=secret'}},r);
 assert.equal(r.statusCode,200);assert.equal(observed.url,'https://test.supabase.co/functions/v1/assistance-native?action=status');assert.equal(observed.options.headers.cookie,undefined);
});
test('gateway rejects cookie only and prevents redirects',async()=>{
 let calls=0;const gateway=createNativeGateway({env:{ASSISTANCE_NATIVE_URL:'https://test.supabase.co/functions/v1/assistance-native'},fetchImpl:async()=>{calls++;return new Response('',{status:302,headers:{location:'https://evil'}});}});
 let r=res();await gateway({url:'/?action=status',method:'GET',headers:{cookie:'x=y'}},r);assert.equal(r.statusCode,401);assert.equal(calls,0);
 r=res();await gateway({url:'/?action=status',method:'GET',headers:{authorization:'Bearer valid'}},r);assert.equal(r.statusCode,502);
});


