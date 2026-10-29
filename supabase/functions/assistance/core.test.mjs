import test from 'node:test';
import assert from 'node:assert/strict';
import {createAssistance,hashSecret,sha256,normalizeLocation,COOKIE} from './core.mjs';
import {updateContextValue,selectPoints,gpxForDay} from './domain.mjs';
import {archiveHashInput,archiveV2Content} from './archive-contract.mjs';
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
 ensureArchive:async(id,date,payload,gpx,original_json)=>{if(!archives.some(a=>a.date===date))archives.push({date,payload,gpx,original_json});}
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

test('notes save and read without requesting GPS; failed optional GPS cannot turn a committed edit into an error',async()=>{
 const f=await fixture(),c=await f.unlock(true),session=await(await f.request('map/session',{cookie:c})).json();
 let gpsReads=0;f.store.points=async()=>{gpsReads++;throw Error('private synthetic GPS failure');};
 const note={date:'2026-10-28',expectedRevision:0,operation:'upsert',entry:{id:'11111111-1111-4111-8111-111111111111',kind:'note',note:'Eigene Notiz'}};
 let r=await f.request('map/context',{method:'POST',cookie:c,headers:{'x-csrf-token':session.csrfToken},body:note});
 assert.equal(r.status,200);assert.equal((await r.json()).revision,1);assert.equal(gpsReads,0);
 r=await f.request('map/context&date=2026-10-28',{cookie:c});assert.equal(r.status,200);assert.equal((await r.json()).entries[0].note,'Eigene Notiz');assert.equal(gpsReads,0);
 const startTimestamp=Date.parse('2026-10-28T10:00:00Z')/1000,endTimestamp=startTimestamp+600;
 const linked=updateContextValue(f.contexts[0],{date:note.date,expectedRevision:1,operation:'upsert',entry:{id:'22222222-2222-4222-8222-222222222222',kind:'activity',label:'Bewusst benannt',startAt:new Date(startTimestamp*1000).toISOString(),endAt:new Date(endTimestamp*1000).toISOString(),segmentRef:{journalIdAtCreation:'synthetic-trip',archiveRevisionAtCreation:null,algorithmVersion:1,startTimestamp,endTimestamp,segmentKind:'trip'}}},new Date(NOW).toISOString());
 f.contexts[0]=linked;
 r=await f.request('map/context&date=2026-10-28',{cookie:c});assert.equal(r.status,200);let value=await r.json();assert.equal(value.entries[1].segmentStatus,'unverified');assert.equal(value.entries[1].needsReview,true);
 const task={date:note.date,expectedRevision:2,operation:'upsert',entry:{id:'33333333-3333-4333-8333-333333333333',kind:'task',title:'Erledigen',status:'open'}};
 r=await f.request('map/context',{method:'POST',cookie:c,headers:{'x-csrf-token':session.csrfToken},body:task});
 assert.equal(r.status,200);value=await r.json();assert.equal(value.revision,3);assert.equal(f.contexts[0].revision,3);assert.equal(value.entries[1].segmentStatus,'unverified');assert.equal(value.entries[2].kind,'task');assert.equal(gpsReads,2);
});

test('task completion remains owner/CSRF protected and concurrent changes preserve unrelated entries',async()=>{
 const f=await fixture(),c=await f.unlock(true),session=await(await f.request('map/session',{cookie:c})).json(),headers={'x-csrf-token':session.csrfToken};
 const entry={id:'11111111-1111-4111-8111-111111111111',kind:'task',title:'Eigene Aufgabe',status:'open',dueDate:'2026-10-30'};
 const create={date:'2026-10-28',expectedRevision:0,operation:'upsert',entry};
 assert.equal((await f.request('map/context',{method:'POST',cookie:c,headers,body:create})).status,200);
 const note={date:create.date,expectedRevision:1,operation:'upsert',entry:{id:'22222222-2222-4222-8222-222222222222',kind:'note',note:'Anderer Eintrag'}};
 assert.equal((await f.request('map/context',{method:'POST',cookie:c,headers,body:note})).status,200);
 const edit={...create,expectedRevision:1,entry:{...entry,status:'done'}};
 assert.equal((await f.request('map/context',{method:'POST',cookie:c,headers,body:edit})).status,409);
 assert.equal(f.contexts[0].entries[0].status,'open');assert.equal(f.contexts[0].entries[1].note,'Anderer Eintrag');
 assert.equal((await f.request('map/context',{method:'POST',cookie:c,headers:{'x-csrf-token':'wrong'},body:{...edit,expectedRevision:2}})).status,403);
 for(const s of f.sessions.values())s.owner_until=new Date(NOW-1).toISOString();
 assert.equal((await f.request('map/context',{method:'POST',cookie:c,headers,body:{...edit,expectedRevision:2}})).status,403);
 assert.equal(f.contexts[0].revision,2);
});

test('context range requires a valid session and returns manual records without GPS/Health reads',async()=>{
 const f=await fixture();let reads=0;f.store.contexts=async(id,from,to)=>{reads++;assert.equal(id,ID);assert.equal(from,'2026-10-27');assert.equal(to,'2026-10-28');return f.contexts;};
 f.store.points=f.store.health=async()=>{throw Error('Sensor reads must not be required');};
 f.contexts.push(updateContextValue(null,{date:'2026-10-28',expectedRevision:0,operation:'upsert',entry:{id:'11111111-1111-4111-8111-111111111111',kind:'note',note:'Notiz'}},new Date(NOW).toISOString()));
 const route='map/context-range&from=2026-10-27&to=2026-10-28';
 assert.equal((await f.request(route)).status,401);assert.equal(reads,0);
 const c=await f.unlock();const r=await f.request(route,{cookie:c});assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');
 const value=await r.json();assert.equal(value.documents[0].entries[0].kind,'note');assert.equal(value.documents[0].revision,1);assert.equal(value.timezone,'Europe/Berlin');assert.equal(reads,1);
 assert.equal((await f.request(route,{cookie:c,method:'POST',body:{}})).status,405);
 for(const s of f.sessions.values())s.valid_until=new Date(NOW-1).toISOString();assert.equal((await f.request(route,{cookie:c})).status,401);assert.equal(reads,1);
});

test('context range rejects bad/oversized query bounds before reads and never exposes partial corrupt storage',async()=>{
 const f=await fixture(),c=await f.unlock();let calls=0;f.store.contexts=async()=>{calls++;return [];};
 for(const query of ['','&from=2026-10-28','&from=2026-10-29&to=2026-10-28','&from=2026-07-30&to=2026-10-28','&from=2026-02-30&to=2026-03-01','&from=2026-10-28&to=2026-10-28&to=2026-10-29','&from=2026-10-28&to=2026-10-28&extra=1']){
   assert.equal((await f.request('map/context-range'+query,{cookie:c})).status,400,query);
 }
 assert.equal(calls,0);
 f.store.contexts=async()=>{throw Error('private synthetic storage detail');};
 let r=await f.request('map/context-range&from=2026-10-28&to=2026-10-28',{cookie:c});assert.equal(r.status,503);assert.ok(!(await r.text()).includes('private synthetic'));
 f.store.contexts=async()=>[{date:'2026-10-28',revision:1,entries:[]}];
 r=await f.request('map/context-range&from=2026-10-28&to=2026-10-28',{cookie:c});assert.equal(r.status,503);assert.equal((await r.json()).documents,undefined);
});

async function recorderPoints(source,device,offset=0) {
  const base=Date.parse('2026-10-27T09:00:00Z')/1000;
  return Promise.all([0,60].map(async seconds=>({...await normalizeLocation({...loc,tst:base+seconds+offset,lat:52,lon:13+seconds/60000},source,device,NOW),receivedAt:new Date(NOW).toISOString()})));
}

async function v2Archive(points,date='2026-10-27') {
  const content=archiveV2Content(points,date),stamp='2026-10-28T00:00:00.000Z';
  const payload={schemaVersion:2,date,revision:1,pointCount:content.points.length,recorderCount:content.journals.length,tripCount:content.journals.reduce((sum,j)=>sum+j.tripCount,0),stayCount:content.journals.reduce((sum,j)=>sum+j.stayCount,0),firstTimestamp:content.points[0].tst,lastTimestamp:content.points.at(-1).tst,archivedAt:stamp,updatedAt:stamp,timeZone:'Europe/Berlin',...content};
  payload.contentHash=await sha256(JSON.stringify(archiveHashInput(payload)));return payload;
}

test('archive import accepts v1 and v2 while rejecting corrupt hashes and duplicate recorder assignment',async()=>{
  const owntracks=await recorderPoints('iphone','d'),native=await recorderPoints('werktag_ios','native'),v2=await v2Archive([...owntracks,...native]);
  let f=await fixture(),body={ownerToken:f.secrets.owner,archives:[{date:v2.date,json:JSON.stringify(v2),gpx:'v2-gpx'}]};
  let response=await f.request('import',{method:'POST',body,origin:false});assert.equal(response.status,200);assert.equal((await response.json()).archives,1);
  const duplicate=structuredClone(v2);duplicate.journals[1].pointIds[0]=duplicate.journals[0].pointIds[0];duplicate.contentHash=await sha256(JSON.stringify(archiveHashInput(duplicate)));
  response=await f.request('import',{method:'POST',body:{...body,archives:[{...body.archives[0],json:JSON.stringify(duplicate)}]},origin:false});assert.equal(response.status,400);
  const badHash={...v2,contentHash:'0'.repeat(64)};response=await f.request('import',{method:'POST',body:{...body,archives:[{...body.archives[0],json:JSON.stringify(badHash)}]},origin:false});assert.equal(response.status,400);
  const journal=selectPoints(owntracks,v2.date).journal,stamp='2026-10-28T00:00:00.000Z',v1={schemaVersion:1,date:v2.date,revision:1,pointCount:owntracks.length,tripCount:journal.trips.length,stayCount:journal.stays.length,firstTimestamp:owntracks[0].tst,lastTimestamp:owntracks.at(-1).tst,archivedAt:stamp,updatedAt:stamp,timeZone:'Europe/Berlin',journal,points:owntracks};v1.contentHash=await sha256(JSON.stringify(archiveHashInput(v1)));
  f=await fixture();response=await f.request('import',{method:'POST',body:{ownerToken:f.secrets.owner,archives:[{date:v1.date,json:JSON.stringify(v1),gpx:'v1-gpx'}]},origin:false});assert.equal(response.status,200);
});

test('map and statistics reject incomplete, duplicate and oversized recorder parameters before sensor reads',async()=>{
  const f=await fixture(),cookie=await f.unlock();let reads=0;f.store.points=async()=>{reads++;return [];};
  for(const route of ['map/data&date=2026-10-27','map/statistics&from=2026-10-27&to=2026-10-27']){
    for(const query of ['&source=iphone','&device=d','&source=&device=d','&source=bad%20source&device=d','&source=iphone&device=','&source=iphone&device=a%00b','&source=iphone&device=a%09b','&source=iphone&device=a%0Ab','&source='+('a'.repeat(65))+'&device=d','&source=iphone&device='+('a'.repeat(257)),'&source=iphone&source=other&device=d','&source=iphone&device=a&device=b']){
      assert.equal((await f.request(route+query,{cookie})).status,400,route+query);
    }
  }
  assert.equal(reads,0);assert.equal(f.archives.length,0);
});

test('map and statistics expose recorder provenance and never fall back from an explicit missing selection',async()=>{
  const f=await fixture(),cookie=await f.unlock(),owntracks=await recorderPoints('iphone','d'),native=await recorderPoints('werktag_ios','native',30);
  f.points.push(...owntracks,...native);
  let response=await f.request('map/data&date=2026-10-27',{cookie}),value=await response.json();
  assert.equal(response.status,200);assert.deepEqual(value.selectedRecorder,{source:'werktag_ios',device:'native'});assert.equal(value.points.length,2);assert.equal(value.recorders.length,2);
  assert.ok(value.points.every(point=>point.source==='werktag_ios'&&point.device==='native'));
  response=await f.request('map/data&date=2026-10-27&source=iphone&device=d',{cookie});value=await response.json();assert.equal(response.status,200);assert.deepEqual(value.points.map(p=>p.id),owntracks.map(p=>p.id));
  response=await f.request('map/statistics&from=2026-10-27&to=2026-10-27&source=iphone&device=d',{cookie});value=await response.json();
  assert.equal(response.status,200);assert.deepEqual(value.selectedRecorder,{source:'iphone',device:'d'});assert.equal(value.summary.gps.pointCount,2);assert.ok(value.summary.gps.distanceMetres<70);
  response=await f.request('map/data&date=2026-10-28&source=iphone&device=d',{cookie});value=await response.json();assert.equal(response.status,200);assert.deepEqual(value.points,[]);assert.deepEqual(value.selectedRecorder,{source:'iphone',device:'d'});
  for(const route of ['map/data&date=2026-10-27','map/statistics&from=2026-10-27&to=2026-10-27'])assert.equal((await f.request(route+'&source=iphone&device=missing',{cookie})).status,404);
  assert.equal(f.points.length,4);
});

test('mixed recorder days create explicit v2 journals without cross-device distance or unknown-selection side effects',async()=>{
  const f=await fixture(),cookie=await f.unlock();f.points.push(...await recorderPoints('iphone','d'),...await recorderPoints('werktag_ios','native'));
  const earlier=(await recorderPoints('iphone','d')).map(p=>({...p,id:'earlier-'+p.id,tst:p.tst-86400}));f.points.push(...earlier);
  assert.equal((await f.request('map/data&date=2026-10-26&source=iphone&device=missing',{cookie})).status,404);assert.equal(f.archives.length,0);
  let response=await f.request('map/data&date=2026-10-27',{cookie}),value=await response.json();
  assert.equal(response.status,200);assert.deepEqual(value.archive.status.deferredDates,[]);assert.deepEqual(f.archives.map(a=>a.date),['2026-10-26','2026-10-27']);
  const saved=f.archives.find(a=>a.date==='2026-10-27');assert.equal(saved.payload.schemaVersion,2);assert.equal(saved.payload.recorderCount,2);assert.equal(saved.payload.journals.length,2);
  assert.deepEqual(saved.payload.journals.map(j=>j.pointCount),[2,2]);assert.ok(saved.payload.journals.every(j=>j.journal.trips[0].distanceMetres<70));
  assert.equal(new Set(saved.payload.journals.flatMap(j=>j.pointIds)).size,4);assert.equal(saved.payload.contentHash,await sha256(JSON.stringify(archiveHashInput(saved.payload))));
  const before=JSON.stringify(f.archives);
  response=await f.request('map/statistics&from=2026-10-26&to=2026-10-27',{cookie});value=await response.json();assert.equal(response.status,200);assert.deepEqual(value.archive.deferredDates,[]);assert.equal(value.days[1].gps.source.kind,'archive');assert.equal(value.days[1].gps.pointCount,2);assert.equal(JSON.stringify(f.archives),before);
  const json=await f.request('map/archive&date=2026-10-27&format=json',{cookie});assert.equal(json.headers.get('x-werktag-archive-version'),'2');assert.equal(await json.text(),saved.original_json);
  const gpx=await f.request('map/archive&date=2026-10-27&format=gpx',{cookie});assert.equal(gpx.status,200);assert.match(await gpx.text(),/archive-v2/);assert.equal(f.points.length,6);
});

test('a preserved v1 archive stays byte-identical after a second recorder appears',async()=>{
  const f=await fixture(),cookie=await f.unlock(),points=await recorderPoints('iphone','d');f.points.push(...points);
  const journal=selectPoints(points,'2026-10-27').journal,stamp='2026-10-28T00:00:00.000Z',payload={schemaVersion:1,date:'2026-10-27',revision:1,pointCount:points.length,tripCount:journal.trips.length,stayCount:journal.stays.length,firstTimestamp:points[0].tst,lastTimestamp:points.at(-1).tst,archivedAt:stamp,updatedAt:stamp,contentHash:await sha256(JSON.stringify({points,journal})),timeZone:'Europe/Berlin',journal,points};
  const original_json=JSON.stringify(payload)+'\n',gpx=gpxForDay(payload.date,points);f.archives.push({date:payload.date,payload,gpx,original_json});
  const before=JSON.stringify(f.archives);
  f.points.push(...await recorderPoints('werktag_ios','native',30));
  const response=await f.request('map/data&date=2026-10-27&source=werktag_ios&device=native',{cookie}),value=await response.json();
  assert.equal(response.status,200);assert.equal(value.archive.days[0].multipleRecorders,true);assert.equal(value.archive.status.archiveSnapshotOlder,true);assert.deepEqual(value.archive.status.deferredDates,[]);
  const jsonResponse=await f.request('map/archive&date=2026-10-27&format=json',{cookie}),gpxResponse=await f.request('map/archive&date=2026-10-27&format=gpx',{cookie});
  assert.equal(jsonResponse.headers.get('x-werktag-archive-version'),'1');assert.equal(await jsonResponse.text(),original_json);assert.equal(await gpxResponse.text(),gpx);assert.equal(JSON.stringify(f.archives),before);
});

test('context references with colliding recorder segment IDs stay explicitly unverified',async()=>{
  const f=await fixture(),cookie=await f.unlock(),owntracks=await recorderPoints('iphone','d');f.points.push(...owntracks);
  const segment=selectPoints(owntracks,'2026-10-27').journal.trips[0];
  f.contexts.push(updateContextValue(null,{date:'2026-10-27',expectedRevision:0,operation:'upsert',entry:{id:'11111111-1111-4111-8111-111111111111',kind:'activity',label:'Eigene Fahrt',startAt:new Date(segment.startTimestamp*1000).toISOString(),endAt:new Date(segment.endTimestamp*1000).toISOString(),segmentRef:{journalIdAtCreation:segment.id,archiveRevisionAtCreation:null,algorithmVersion:1,startTimestamp:segment.startTimestamp,endTimestamp:segment.endTimestamp,segmentKind:segment.kind}}},new Date(NOW).toISOString()));
  let value=await(await f.request('map/context&date=2026-10-27',{cookie})).json();assert.equal(value.entries[0].segmentStatus,'matched');
  f.contexts[0]=updateContextValue(f.contexts[0],{date:'2026-10-27',expectedRevision:1,operation:'upsert',entry:{id:'22222222-2222-4222-8222-222222222222',kind:'activity',label:'Recordergebundene Fahrt',startAt:new Date(segment.startTimestamp*1000).toISOString(),endAt:new Date(segment.endTimestamp*1000).toISOString(),segmentRef:{journalIdAtCreation:segment.id,archiveRevisionAtCreation:null,algorithmVersion:1,startTimestamp:segment.startTimestamp,endTimestamp:segment.endTimestamp,segmentKind:segment.kind,source:'iphone',device:'d'}}},new Date(NOW).toISOString());
  f.points.push(...await recorderPoints('werktag_ios','native'));
  value=await(await f.request('map/context&date=2026-10-27',{cookie})).json();assert.equal(value.entries[0].segmentStatus,'unverified');assert.equal(value.entries[0].needsReview,true);assert.equal(value.entries[1].segmentStatus,'matched');assert.equal(value.entries[1].needsReview,false);assert.equal(f.contexts[0].revision,2);
});

test('an exact labelled context reference remains matchable beside legacy points while v2 stays deferred',async()=>{
  const f=await fixture(),cookie=await f.unlock(),labelled=await recorderPoints('iphone','d'),legacy=labelled.map(point=>{const {source,device,...rest}=point;return{...rest,id:'legacy-'+point.id};});f.points.push(...labelled,...legacy);
  const segment=selectPoints(labelled,'2026-10-27').journal.trips[0],base={journalIdAtCreation:segment.id,archiveRevisionAtCreation:null,algorithmVersion:1,startTimestamp:segment.startTimestamp,endTimestamp:segment.endTimestamp,segmentKind:segment.kind};
  let context=updateContextValue(null,{date:'2026-10-27',expectedRevision:0,operation:'upsert',entry:{id:'11111111-1111-4111-8111-111111111111',kind:'activity',label:'Alter Bezug',startAt:new Date(segment.startTimestamp*1000).toISOString(),endAt:new Date(segment.endTimestamp*1000).toISOString(),segmentRef:base}},new Date(NOW).toISOString());
  context=updateContextValue(context,{date:'2026-10-27',expectedRevision:1,operation:'upsert',entry:{id:'22222222-2222-4222-8222-222222222222',kind:'activity',label:'Eindeutiger Bezug',startAt:new Date(segment.startTimestamp*1000).toISOString(),endAt:new Date(segment.endTimestamp*1000).toISOString(),segmentRef:{...base,source:'iphone',device:'d'}}},new Date(NOW).toISOString());f.contexts.push(context);
  const value=await(await f.request('map/context&date=2026-10-27',{cookie})).json();assert.equal(value.entries[0].segmentStatus,'unverified');assert.equal(value.entries[1].segmentStatus,'matched');
  const data=await(await f.request('map/data&date=2026-10-27&source=iphone&device=d',{cookie})).json();assert.deepEqual(data.archive.status.deferredDates,['2026-10-27']);assert.equal(f.archives.length,0);
});
