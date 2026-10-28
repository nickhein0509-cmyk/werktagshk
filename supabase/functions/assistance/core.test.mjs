import test from 'node:test';
import assert from 'node:assert/strict';
import {createAssistance,hashSecret,sha256,normalizeLocation,COOKIE} from './core.mjs';
const NOW=Date.parse('2026-10-28T12:00:00Z'),ID='b4f2aa0a-c752-42f4-9b9d-10aecf7c9420';
async function fixture(){
 const secrets={username:'iphone',password:'p'.repeat(40),map:'m'.repeat(43),owner:'o'.repeat(43)};
 const install={id:ID,salt:'s'.repeat(32),owner_user_id:null};
 for(const [a,b] of [['username','username_hash'],['password','password_hash'],['map','map_hash'],['owner','owner_hash']])install[b]=await hashSecret(install.salt,secrets[a]);
 const sessions=new Map(),points=[],health=[],contexts=[],archives=[],calls=[];let receipts=null;
 const store={
 installation:async()=>install,getUser:async t=>t==='user-a'?{id:'a'}:t==='user-b'?{id:'b'}:t==='anonymous'?{id:'anon',is_anonymous:true}:null,
 session:async(id,h)=>sessions.get(h),putSession:async v=>sessions.set(v.token_hash,v),updateSession:async(id,h,v)=>Object.assign(sessions.get(h),v),deleteSession:async(id,h)=>sessions.delete(h),
 claim:async(id,u)=>{if(install.owner_user_id&&install.owner_user_id!==u)return false;install.owner_user_id=u;return true;},
 ingest:async(id,p,type)=>{calls.push({id,p,type});const duplicate=p&&points.some(x=>x.id===p.id);if(p&&!duplicate)points.push({...p,receivedAt:new Date(NOW).toISOString()});receipts={lastMessageAt:new Date(NOW).toISOString(),lastLocationWasDuplicate:duplicate};},
 import:async(id,data)=>{calls.push({import:data});return{points:data.points.length,health:data.health.length,contexts:data.contexts.length,archives:data.archives.length};},
 points:async()=>points,health:async()=>health,contexts:async()=>contexts,context:async(id,d)=>contexts.find(x=>x.date===d)??null,
 writeContext:async(id,date,revision,v)=>{const i=contexts.findIndex(c=>c.date===date);if((contexts[i]?.revision??0)!==revision)return false;if(i<0)contexts.push(v);else contexts[i]=v;return true;},
 archives:async()=>archives,archive:async(id,date)=>archives.find(x=>x.date===date),receipts:async()=>receipts,
 ensureArchive:async(id,date,payload,gpx)=>{if(!archives.some(a=>a.date===date))archives.push({date,payload,gpx});}
 };
 const handle=createAssistance({store,installationId:ID,now:()=>NOW});
 const request=(route,{method='GET',body,headers={},origin=true,cookie}={})=>handle(new Request('https://example.supabase.co/functions/v1/assistance?route='+route,{method,headers:{...(origin?{origin:'https://werk-tag.com'}:{}),...(body!==undefined?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})}));
 async function unlock(owner=false){let r=await request('map/auth',{method:'POST',body:{key:secrets.map}});const c=r.headers.get('set-cookie').split(';')[0];if(owner)await request('map/owner',{method:'POST',body:{token:secrets.owner},cookie:c});return c;}
 return{secrets,install,sessions,points,health,contexts,archives,calls,store,request,unlock,handle};
}
const loc={_type:'location',tst:1793188800,lat:52.1,lon:13.2,acc:5,tid:'ip'};
test('OwnTracks IDs exactly match existing JS array hashing and validate metadata',async()=>{
 const row=await normalizeLocation(loc,'iphone','original-device',NOW);assert.equal(row.id,await sha256(JSON.stringify(['iphone','original-device',loc.tst,loc.lat,loc.lon])));assert.equal(row.receivedAt,undefined);
 for(const change of [{lat:91},{tst:1},{acc:-1},{batt:101},{tid:'x'.repeat(17)}])await assert.rejects(normalizeLocation({...loc,...change},'iphone','d',NOW));
});
test('Basic ingestion preserves device header, duplicate acknowledgment and rejects before storage',async()=>{
 const f=await fixture(),headers={authorization:'Basic '+btoa(f.secrets.username+':'+f.secrets.password),'x-limit-d':'device-header'};
 assert.equal((await f.request('pub',{method:'POST',body:loc,headers})).status,200);assert.equal(f.calls[0].p.device,'device-header');
 assert.equal((await f.request('pub',{method:'POST',body:loc,headers})).status,200);assert.equal(f.points.length,1);
 assert.equal((await f.request('pub',{method:'POST',body:loc,headers:{authorization:'Basic '+btoa('iphone:bad')}})).status,401);
 assert.equal((await f.request('pub',{method:'POST',body:{...loc,lat:91},headers})).status,400);assert.equal(f.calls.length,2);
});
test('Only valid legacy read capability obtains secure random cookie; no data without session',async()=>{
 const f=await fixture();assert.equal((await f.request('map/data')).status,401);
 assert.equal((await f.request('map/auth',{method:'POST',body:{key:'bad'}})).status,401);
 const response=await f.request('map/auth',{method:'POST',body:{key:f.secrets.map}}),header=response.headers.get('set-cookie');assert.match(header,new RegExp('^'+COOKIE+'=[a-f0-9]{64};'));for(const flag of ['Secure','HttpOnly','SameSite=Strict','Path=/assistenz'])assert.ok(header.includes(flag));
 const c=header.split(';')[0],session=await(await f.request('map/session',{cookie:c})).json();assert.equal(session.canWrite,false);assert.equal(session.accountBound,false);assert.equal(session.csrfToken,null);
});
test('Cross-site mutations and expired sessions fail',async()=>{
 const f=await fixture();assert.equal((await f.request('map/auth',{method:'POST',body:{key:f.secrets.map},headers:{origin:'https://evil.example'}})).status,403);
 const c=await f.unlock();for(const s of f.sessions.values())s.valid_until=new Date(NOW-1).toISOString();assert.equal((await f.request('map/data',{cookie:c})).status,401);
});
test('Verified account and ownerKey claim are both required; reassignment is rejected',async()=>{
 const f=await fixture();assert.equal((await f.request('account/claim',{method:'POST',body:{ownerKey:f.secrets.owner}})).status,401);
 assert.equal((await f.request('account/claim',{method:'POST',body:{ownerKey:f.secrets.owner},headers:{authorization:'Bearer anonymous'}})).status,401);
 assert.equal((await f.request('account/claim',{method:'POST',body:{ownerKey:f.secrets.map},headers:{authorization:'Bearer user-a'}})).status,403);
 let r=await f.request('account/claim',{method:'POST',body:{ownerKey:f.secrets.owner},headers:{authorization:'Bearer user-a'}});assert.equal(r.status,200);assert.equal(f.install.owner_user_id,'a');
 const c=r.headers.get('set-cookie').split(';')[0],s=await(await f.request('map/session',{cookie:c})).json();assert.equal(s.accountBound,true);assert.equal(s.canWrite,true);
 assert.equal((await f.request('account/claim',{method:'POST',body:{ownerKey:f.secrets.owner},headers:{authorization:'Bearer user-b'}})).status,409);
 assert.deepEqual(await(await f.request('account/status',{headers:{authorization:'Bearer user-b'}})).json(),{authenticated:true,linked:false,canRead:false,claimed:true,installationId:null});
});
test('Account sessions cannot survive changed ownership or be minted for another account',async()=>{
 const f=await fixture();f.install.owner_user_id='a';assert.equal((await f.request('account/session',{method:'POST',headers:{authorization:'Bearer user-b'}})).status,403);
 const r=await f.request('account/session',{method:'POST',headers:{authorization:'Bearer user-a'}}),c=r.headers.get('set-cookie').split(';')[0];f.install.owner_user_id='b';assert.equal((await f.request('map/data',{cookie:c})).status,401);
});
test('Context mutations require owner lease and session CSRF; data keeps revision and source',async()=>{
 const f=await fixture(),c=await f.unlock(),body={date:'2026-10-28',expectedRevision:0,operation:'upsert',entry:{id:'11111111-1111-4111-8111-111111111111',kind:'hydration',amountMl:300}};
 assert.equal((await f.request('map/context',{method:'POST',body,cookie:c})).status,403);
 await f.request('map/owner',{method:'POST',body:{token:f.secrets.owner},cookie:c});const s=await(await f.request('map/session',{cookie:c})).json();
 assert.equal((await f.request('map/context',{method:'POST',body,cookie:c,headers:{'x-csrf-token':'bad'}})).status,403);
 const r=await f.request('map/context',{method:'POST',body,cookie:c,headers:{'x-csrf-token':s.csrfToken}});assert.equal(r.status,200);const v=await r.json();assert.equal(v.revision,1);assert.equal(v.entries[0].source.provider,'MANUAL');
});
test('Import validates every point ID before calling atomic insert-only store',async()=>{
 const f=await fixture(),p={...await normalizeLocation(loc,'iphone','d',NOW),receivedAt:new Date(NOW-1000).toISOString()};
 assert.equal((await f.request('import',{method:'POST',body:{ownerToken:f.secrets.owner,points:[{...p,id:'0'.repeat(64)}]},origin:false})).status,400);assert.equal(f.calls.length,0);
 const r=await f.request('import',{method:'POST',body:{ownerToken:f.secrets.owner,points:[p]},origin:false});assert.equal(r.status,200);assert.equal((await r.json()).points,1);assert.equal(f.calls[0].import.points[0].receivedAt,p.receivedAt);
});
test('Logout revokes exact random session and clears identical cookie path',async()=>{
 const f=await fixture(),c=await f.unlock();const r=await f.request('map/logout',{method:'POST',cookie:c});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/; Path=\/assistenz; Max-Age=0; Secure; HttpOnly; SameSite=Strict/);assert.equal(f.sessions.size,0);assert.equal((await f.request('map/data',{cookie:c})).status,401);
});
test('Storage failure never returns successful OwnTracks acknowledgment or secret error',async()=>{
 const f=await fixture();f.store.ingest=async()=>{throw Error('private-password');};const r=await f.request('pub',{method:'POST',body:loc,headers:{authorization:'Basic '+btoa(f.secrets.username+':'+f.secrets.password)}});assert.equal(r.status,503);assert.ok(!(await r.text()).includes('private-password'));
});
test('Completed days persist once; late arrival warns without rewriting original snapshot',async()=>{
 const f=await fixture(),c=await f.unlock(),base=Math.floor(NOW/1000)-86400;
 for(const [i,seconds] of [0,600].entries())f.points.push({...await normalizeLocation({...loc,tst:base+seconds,lat:52+i*.01},'iphone','d',NOW),receivedAt:new Date(NOW-2000+i).toISOString()});
 let r=await f.request('map/data&date=2026-10-27',{cookie:c});assert.equal(r.status,200);let v=await r.json();assert.equal(f.archives.length,1);assert.equal(v.archive.status.mode,'on-demand');const original=JSON.stringify(f.archives[0].payload);
 f.points.push({...await normalizeLocation({...loc,tst:base+300,lat:52.005},'iphone','d',NOW),receivedAt:new Date(NOW).toISOString()});
 r=await f.request('map/data&date=2026-10-27',{cookie:c});v=await r.json();assert.equal(v.points.length,3);assert.equal(v.archive.status.archiveSnapshotOlder,true);assert.deepEqual(v.archive.status.olderDates,['2026-10-27']);assert.equal(JSON.stringify(f.archives[0].payload),original);assert.equal(v.archive.days[0].livePointCount,3);
});
