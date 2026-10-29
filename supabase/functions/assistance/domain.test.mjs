import test from 'node:test';
import assert from 'node:assert/strict';
import {selectPoints,berlinDay,healthView,validateHealthDay,emptyContext,updateContextValue,validateContextValue,contextView,validateContextRange,contextRange,statisticsFromData,gpxForDay} from './domain.mjs';
import {route} from './semantics/route.js';
import {buildJournal} from './semantics/journal.js';

const id='12345678-1234-4234-8234-123456789abc';
const point=(iso,lon=13.4,extra={})=>({id:iso,tst:Date.parse(iso)/1000,lat:52.5,lon,receivedAt:iso,...extra});
const metric=(value,unit='count')=>({value,unit,sourceDevice:'Merged (HealthKit daily statistics)',updatedAt:'2026-10-28T10:00:00.000Z'});
const health=(date,metrics)=>({schemaVersion:1,date,provider:'APPLE_HEALTH',timezone:'Europe/Berlin',source:'Apple Health via Freddy',fetchedAt:'2026-10-28T10:00:00.000Z',sourceLastSyncAt:'2026-10-28T09:59:00.000Z',sourceLastDataAt:null,metrics});
const request=(entry,expectedRevision=0)=>({date:'2026-10-28',expectedRevision,operation:'upsert',entry});
const now='2026-10-28T12:00:00.000Z';

 test('selection preserves global latest timestamps while filtering Berlin day and ordering delayed points',()=>{
  const late=point('2026-10-27T23:10:00Z',13.401,{receivedAt:'2026-10-28T12:00:00Z'}),early=point('2026-10-27T22:50:00Z');
  const result=selectPoints([late,early],'2026-10-27');
  assert.equal(berlinDay(late.tst),'2026-10-28');assert.equal(result.points.length,1);assert.equal(result.points[0].id,early.id);
  assert.equal(result.latestSourceTimestamp,late.tst);assert.equal(result.latestReceivedAt,late.receivedAt);assert.deepEqual(result.days,['2026-10-28','2026-10-27']);
  const clipped=selectPoints([late,early],'all',1);assert.equal(clipped.truncated,true);assert.equal(clipped.totalSelected,2);assert.equal(clipped.totalStored,2);
 });
 test('Berlin day honors summer/winter offsets at DST boundary',()=>{
  assert.equal(berlinDay(Date.parse('2026-10-24T22:30:00Z')/1000),'2026-10-25');
  assert.equal(berlinDay(Date.parse('2026-10-25T22:30:00Z')/1000),'2026-10-25');
 });
 test('health views preserve missing values and keep all-days view metadata-only',()=>{
  const day=health('2026-10-27',{steps_total:metric(1234)});
  assert.equal(validateHealthDay(day,day.date),day);assert.deepEqual(healthView([day],'all').metrics,{});
  assert.equal(healthView([day],'2026-10-28').status,'empty');assert.deepEqual(healthView([day],'2026-10-28').metrics,{});
  assert.equal(healthView([day],day.date).metrics.steps_total.value,1234);
  assert.equal(healthView([health(day.date,{steps_total:metric(-1)})],day.date).status,'error');
 });
 test('health validators require merged totals and actual VO2 observation evidence',()=>{
  assert.throws(()=>validateHealthDay(health('2026-10-27',{steps_total:{...metric(1),sourceDevice:'iPhone'}}),'2026-10-27'));
  const observation={value:48,unit:'ml/kg/min',sourceDevice:'Apple Watch',updatedAt:now,observedAt:'2026-10-27T12:00:00.000Z',observedAtPrecision:'minute',sourceTimestamp:'13:00 UTC+01:00'};
  const value={...observation,aggregation:'latest-observation',observations:[observation]};
  const day=health('2026-10-27',{vo2_max:value});assert.equal(validateHealthDay(day,day.date),day);
  assert.throws(()=>validateHealthDay(health(day.date,{vo2_max:{...value,observedAt:now}}),day.date));
  assert.throws(()=>validateHealthDay(health(day.date,{vo2_max:{...value,observations:[observation,{...observation,value:49,sourceDevice:'Other Watch'}]}}),day.date));
 });
 test('context update normalizes entries, records manual provenance and does not mutate prior values',()=>{
  const previous=emptyContext('2026-10-28'),saved=updateContextValue(previous,request({id:id.toUpperCase(),kind:'hydration',amountMl:250,note:' Wasser '}),now);
  assert.equal(previous.entries.length,0);assert.equal(saved.revision,1);assert.equal(saved.entries[0].id,id);assert.equal(saved.entries[0].note,'Wasser');
  assert.deepEqual(saved.entries[0].source,{provider:'MANUAL',sourceId:null});assert.equal(saved.entries[0].createdAt,now);assert.equal(validateContextValue(saved,saved.date),saved);
 });
 test('context no-op retries precede revision conflicts; real edits require current revision',()=>{
  const entry={id,kind:'weight',kg:80},saved=updateContextValue(null,request(entry),now);
  assert.deepEqual(updateContextValue(saved,request(entry,0),now),saved);
  assert.throws(()=>updateContextValue(saved,request({...entry,kg:81},0),now),error=>error.statusCode===409);
  assert.deepEqual(updateContextValue(saved,{date:saved.date,expectedRevision:0,operation:'delete',id:'abcdefab-1234-4234-8234-123456789abc'},now),saved);
  assert.throws(()=>updateContextValue(saved,request({id,kind:'hydration',amountMl:300},1),now));
 });
 test('context references flag changed segment instead of silently attaching to a different route',()=>{
  const segment={id:'trip-1',kind:'trip',startTimestamp:1793174400,endTimestamp:1793175000,pointCount:3};
  const entry={id,kind:'activity',label:'Arbeit',startAt:new Date(segment.startTimestamp*1000).toISOString(),endAt:new Date(segment.endTimestamp*1000).toISOString(),segmentRef:{journalIdAtCreation:segment.id,archiveRevisionAtCreation:1,algorithmVersion:1,startTimestamp:segment.startTimestamp,endTimestamp:segment.endTimestamp,segmentKind:'trip',anchorFingerprint:'trip:1793174400:1793175000:3'}};
  // Pick the date from the observation, including the local offset.
  const date=berlinDay(segment.startTimestamp),saved=updateContextValue(null,{date,expectedRevision:0,operation:'upsert',entry},now);
  assert.equal(contextView(saved,{trips:[segment],stays:[]}).entries[0].segmentStatus,'matched');
  assert.equal(contextView(saved,{trips:[{...segment,pointCount:4}],stays:[]}).entries[0].needsReview,true);
  assert.equal(contextView(saved).entries[0].segmentStatus,'unverified');
 });
 test('GPX and journal do not bridge recording gaps or inaccurate fixes',()=>{
  const points=[point('2026-10-28T10:00:00Z'),point('2026-10-28T10:05:00Z',13.401),point('2026-10-28T10:30:00Z',13.402),point('2026-10-28T10:35:00Z',13.403,{acc:200}),point('2026-10-28T10:40:00Z',13.404)];
  const selected=selectPoints(points,'2026-10-28'),gpx=gpxForDay('2026-10-28',points);
  assert.equal(selected.journal.gaps,1);assert.equal(selected.journal.uncertain,1);assert.equal((gpx.match(/<trkseg>/g)??[]).length,3);assert.equal((gpx.match(/<trkpt /g)??[]).length,4);
 });
 test('statistics keep absent data null, sum totals, average daily means and select latest real VO2',()=>{
  const observation=(value,observedAt)=>({value,unit:'ml/kg/min',sourceDevice:'Apple Watch',updatedAt:now,observedAt,observedAtPrecision:'second',sourceTimestamp:observedAt});
  const vo2=(value,at)=>{const o=observation(value,at);return {...o,aggregation:'latest-observation',observations:[o]};};
  const days=[health('2026-10-26',{steps_total:metric(100),heart_rate_merged_avg:metric(60,'bpm'),vo2_max:vo2(48,'2026-10-26T10:00:00.000Z')}),health('2026-10-27',{steps_total:metric(200),heart_rate_merged_avg:metric(80,'bpm'),vo2_max:vo2(47,'2026-10-27T10:00:00.000Z')})];
  const result=statisticsFromData({healthDays:days,from:'2026-10-26',to:'2026-10-28',bucket:'week',now:Date.parse(now)});
  const metrics=result.summary.health.metrics;assert.equal(metrics.steps_total.value,300);assert.equal(metrics.heart_rate_merged_avg.value,70);assert.equal(metrics.vo2_max.value,47);assert.equal(metrics.steps_total.missingDays,1);
  assert.equal(result.summary.gps.distanceMetres,null);assert.equal(metrics.sleep_total_seconds.value,null);assert.equal(result.quality.partial,true);assert.equal(result.days.at(-1).provisional,true);
 });
 test('statistics derive measured route only and reject invalid dates or oversized ranges',()=>{
  const points=[point('2026-10-27T10:00:00Z'),point('2026-10-27T10:05:00Z',13.401),point('2026-10-27T11:00:00Z',13.5)];
  const result=statisticsFromData({points,from:'2026-10-27',to:'2026-10-27',now:Date.parse(now)});
  assert.equal(result.days[0].gps.gaps,1);assert.ok(result.summary.gps.distanceMetres<100);assert.equal(result.days[0].gps.source.kind,'cloud-derived');
  assert.throws(()=>statisticsFromData({from:'2026-10-29',to:'2026-10-28',now:Date.parse(now)}));
  assert.throws(()=>statisticsFromData({from:'2020-01-01',to:'2026-10-28',now:Date.parse(now)}));
 });
 test('late arrivals remain in statistics without changing the original archive snapshot',()=>{
  const original=[point('2026-10-27T10:00:00Z'),point('2026-10-27T10:05:00Z',13.401)],snapshot={schemaVersion:1,date:'2026-10-27',timeZone:'Europe/Berlin',revision:1,updatedAt:'2026-10-28T00:00:00.000Z',pointCount:2,contentHash:'preserved-original-hash',points:original,journal:selectPoints(original,'2026-10-27').journal};
  const before=JSON.stringify(snapshot),late=point('2026-10-27T10:10:00Z',13.402,{receivedAt:now});
  const result=statisticsFromData({points:[...original,late],archives:[snapshot],from:snapshot.date,to:snapshot.date,now:Date.parse(now)});
  assert.equal(result.days[0].gps.pointCount,3);assert.equal(result.days[0].gps.source.kind,'cloud-derived');assert.equal(result.days[0].gps.source.archiveSnapshotOlder,true);assert.equal(JSON.stringify(snapshot),before);
  const unchanged=statisticsFromData({points:original,archives:[snapshot],from:snapshot.date,to:snapshot.date,now:Date.parse(now)});assert.equal(unchanged.days[0].gps.source.kind,'archive');assert.equal(unchanged.days[0].gps.source.contentHash,snapshot.contentHash);
  const changedJournal=structuredClone(snapshot);changedJournal.journal.trips[0].endReason='older-boundary';
  const rebuilt=statisticsFromData({points:original,archives:[changedJournal],from:snapshot.date,to:snapshot.date,now:Date.parse(now)});assert.equal(rebuilt.days[0].gps.source.archiveSnapshotOlder,true);
 });

test('notes and tasks preserve manual provenance, timing, revisions and idempotent retries',()=>{
  const note={id,kind:'note',note:'  Eigene Notiz  ',title:'  Titel  ',at:'2026-10-27T23:30:00Z'};
  const saved=updateContextValue(null,request(note),now);
  assert.equal(saved.entries[0].note,'Eigene Notiz');assert.equal(saved.entries[0].title,'Titel');
  assert.equal(saved.entries[0].at,'2026-10-27T23:30:00.000Z');
  assert.deepEqual(saved.entries[0].source,{provider:'MANUAL',sourceId:null});
  assert.deepEqual(updateContextValue(saved,request(note),now),saved);
  assert.throws(()=>updateContextValue(saved,request({...note,note:'Geändert'}),now),e=>e.statusCode===409);
  const task={id:'abcdefab-1234-4234-8234-123456789abc',kind:'task',title:'Rückruf',status:'open',dueDate:'2026-11-02',note:'Eigene Aufgabe'};
  const withTask=updateContextValue(saved,request(task,1),now);
  const completed=updateContextValue(withTask,request({...task,status:'done'},2),'2026-10-28T12:01:00Z');
  assert.equal(withTask.entries[1].status,'open');assert.equal(completed.entries[1].status,'done');
  assert.equal(completed.entries[1].createdAt,now);assert.equal(completed.entries[1].revision,2);
  assert.equal(completed.entries[1].dueDate,'2026-11-02');assert.equal(completed.revision,3);
  assert.equal(validateContextValue(completed,completed.date),completed);
  assert.throws(()=>updateContextValue(completed,request({...task,kind:'note',note:'Kein Typwechsel'},3),now));
});

test('note and task validation rejects empty text, foreign fields, invalid dates and unsupported status',()=>{
  for(const entry of [
    {id,kind:'note',note:'  '},{id,kind:'note',title:'Ohne Text'},
    {id,kind:'note',note:'x'.repeat(2001)},{id,kind:'note',note:'Text',title:'x'.repeat(121)},
    {id,kind:'note',note:'Text',at:'2026-10-28T23:30:00Z'},
    {id,kind:'note',note:'Text',at:'2026-02-30T12:00:00Z'},
    {id,kind:'note',note:'Text',source:{provider:'AI'}},
    {id,kind:'task',title:'',status:'open'},{id,kind:'task',title:'Aufgabe'},
    {id,kind:'task',title:'Aufgabe',status:'cancelled'},
    {id,kind:'task',title:'Aufgabe',status:'done',completedAt:now},
    ...['2026-02-30','1999-12-31','2101-01-01','2026-1-01'].map(dueDate=>({id,kind:'task',title:'Aufgabe',status:'open',dueDate})),
  ])assert.throws(()=>updateContextValue(null,request(entry),now),e=>e.statusCode===400);
  for(const dueDate of ['2000-01-01','2100-12-31']){
    assert.equal(updateContextValue(null,request({id,kind:'task',title:'Aufgabe',status:'open',dueDate}),now).entries[0].dueDate,dueDate);
  }
});

test('context range returns only a complete, sorted manual notes/tasks projection without sensor fields',()=>{
  const note=updateContextValue(null,request({id,kind:'note',note:'Privater Text'}),now);
  // Old/imported extras cannot carry unrelated data into the workspace response.
  note.entries[0].location={lat:52,lon:13};note.entries[0].source.unrelatedHealth='must not escape';
  let other=updateContextValue(null,{date:'2026-10-27',expectedRevision:0,operation:'upsert',entry:{id,kind:'hydration',amountMl:300}},now);
  other=updateContextValue(other,{date:'2026-10-27',expectedRevision:1,operation:'upsert',entry:{id:'abcdefab-1234-4234-8234-123456789abc',kind:'task',title:'Später',status:'open'}},now);
  const before=JSON.stringify([note,other]);
  const range=contextRange([note,other],'2026-10-27','2026-10-28');
  assert.deepEqual(Object.keys(range),['schemaVersion','timezone','from','to','documents']);
  assert.equal(range.timezone,'Europe/Berlin');assert.deepEqual(range.documents.map(d=>d.date),['2026-10-27','2026-10-28']);
  assert.deepEqual(range.documents.map(d=>d.entries.map(e=>e.kind)),[['task'],['note']]);
  assert.equal(range.documents[0].revision,2);assert.equal(range.documents[1].entries[0].location,undefined);
  assert.deepEqual(range.documents[1].entries[0].source,{provider:'MANUAL',sourceId:null});
  assert.equal(JSON.stringify([note,other]),before);
  assert.equal(contextRange([note,other],'2026-10-28','2026-10-28').documents.length,1);
  assert.deepEqual(contextRange([],'2026-10-28','2026-10-28').documents,[]);
});

test('context range rejects invalid bounds and corrupt snapshots instead of returning partial data',()=>{
  assert.deepEqual(validateContextRange('2026-07-31','2026-10-28'),{from:'2026-07-31',to:'2026-10-28'});
  for(const [from,to] of [[undefined,'2026-10-28'],['2026-10-28',null],['2026-10-29','2026-10-28'],['2026-07-30','2026-10-28'],['2026-02-30','2026-03-01'],['1999-12-31','2000-01-01']]){
    assert.throws(()=>validateContextRange(from,to),e=>e.statusCode===400);
  }
  const saved=updateContextValue(null,request({id,kind:'note',note:'Text'}),now);
  assert.throws(()=>contextRange([saved,{date:'bad'}],'2026-10-28','2026-10-28'),e=>e.statusCode===503);
  assert.throws(()=>contextRange([saved,saved],'2026-10-28','2026-10-28'),e=>e.statusCode===503);
});

test('context range rejects entry and UTF-8 byte overflow without truncation',()=>{
  const template=updateContextValue(null,request({id,kind:'note',note:'Text'}),now);
  const document=(date,count,note='Text')=>({...template,date,entries:Array.from({length:count},(_,i)=>({...template.entries[0],id:(i+1).toString(16).padStart(8,'0')+'-1234-4234-8234-123456789abc',note}))});
  const tooMany=[24,25,26,27,28].map((day,i)=>document('2026-10-'+day,i===4?1:500));
  assert.throws(()=>contextRange(tooMany,'2026-10-24','2026-10-28'),e=>e.statusCode===413);
  const tooLarge=[document('2026-10-27',350,'界'.repeat(1800)),document('2026-10-28',350,'界'.repeat(1800))];
  assert.throws(()=>contextRange(tooLarge,'2026-10-27','2026-10-28'),e=>e.statusCode===413);
});

test('notes/tasks statistics count manual entries without inventing activity or measured data',()=>{
  let saved=updateContextValue(null,request({id,kind:'note',note:'Tagesnotiz'}),now);
  saved=updateContextValue(saved,request({id:'abcdefab-1234-4234-8234-123456789abc',kind:'task',title:'Aufgabe',status:'done'},1),now);
  const result=statisticsFromData({contexts:[saved],from:saved.date,to:saved.date,now:Date.parse(now)});
  assert.equal(result.summary.context.counts.note,1);assert.equal(result.summary.context.counts.task,1);
  assert.deepEqual(result.summary.context.activityLabels,[]);assert.equal(result.summary.context.planned.count,0);
  assert.equal(result.summary.gps.present,false);assert.equal(result.summary.health.present,false);
});

function parallelRecordings() {
  const make=(source,device,seconds,lat,lon)=>point(new Date(Date.parse('2026-10-27T09:00:00Z')+seconds*1000).toISOString(),lon,{source,device,lat,acc:5,id:source+'-'+device+'-'+seconds});
  return {
    owntracks:[make('iphone','owntracks',0,52,13),make('iphone','owntracks',60,52,13.001)],
    native:[make('werktag_ios','native',30,52.0002,13),make('werktag_ios','native',90,52.0002,13.001)],
  };
}

test('a day chooses one recorder and never draws a connecting leg between parallel devices',()=>{
  const {owntracks,native}=parallelRecordings(),points=[...owntracks,...native],before=JSON.stringify(points);
  const view=selectPoints(points,'2026-10-27');
  assert.deepEqual(view.selectedRecorder,{source:'werktag_ios',device:'native'});
  assert.deepEqual(view.points.map(p=>p.id),native.map(p=>p.id));
  assert.ok(view.points.every(p=>p.source==='werktag_ios'&&p.device==='native'));
  assert.equal(view.recorders.length,2);assert.deepEqual(view.recorders.map(r=>r.pointCount),[2,2]);
  assert.equal(view.totalStored,4);assert.equal(view.totalSelected,2);
  const oldMixedDistance=route([...points].sort((a,b)=>a.tst-b.tst)).distance;
  assert.ok(oldMixedDistance>110);assert.ok(view.journal.trips[0].distanceMetres<70);
  const explicit=selectPoints(points,'2026-10-27',1,{source:'iphone',device:'owntracks'});
  assert.equal(explicit.totalSelected,2);assert.equal(explicit.truncated,true);assert.equal(explicit.points[0].id,owntracks[1].id);
  assert.equal(JSON.stringify(points),before);
});

test('recorder defaults are period-scoped and deterministic while explicit empty selections never switch',()=>{
  const {owntracks,native}=parallelRecordings();
  const later=native.map(p=>({...p,tst:p.tst+86400,receivedAt:'2026-10-28T10:00:00Z'}));
  const points=[...owntracks,...later];
  assert.deepEqual(selectPoints(points,'2026-10-27').selectedRecorder,{source:'iphone',device:'owntracks'});
  const empty=selectPoints(points,'2026-10-27',20000,{source:'werktag_ios',device:'native'});
  assert.deepEqual(empty.points,[]);assert.deepEqual(empty.selectedRecorder,{source:'werktag_ios',device:'native'});
  assert.throws(()=>selectPoints(points,'2026-10-27',20000,{source:'werktag_ios',device:'missing'}),e=>e.status===404);
  const tied=owntracks.map(p=>({...p,source:'alpha',device:'a'}));
  for(const order of [[...owntracks,...tied],[...tied,...owntracks].reverse()])assert.deepEqual(selectPoints(order,'2026-10-27').selectedRecorder,{source:'alpha',device:'a'});
  const sameSource=[...owntracks,...owntracks.map(p=>({...p,device:'second-device',tst:p.tst+1}))];
  assert.equal(selectPoints(sameSource,'2026-10-27').recorders.length,2);
});

test('unlabelled legacy fixtures stay separate from named sources',()=>{
  const legacy=[point('2026-10-27T10:00:00Z'),point('2026-10-27T10:01:00Z',13.401)];
  const old=selectPoints(legacy,'2026-10-27');assert.equal(old.selectedRecorder,null);assert.deepEqual(old.recorders,[]);assert.equal(old.points.length,2);
  const {native}=parallelRecordings(),combined=selectPoints([...native,...legacy],'2026-10-27');
  assert.equal(combined.selectedRecorder,null);assert.equal(combined.points.length,2);assert.equal(combined.recorders.length,1);
});

test('statistics use one selected recorder for the whole range and ignore incompatible archived journals',()=>{
  const {owntracks,native}=parallelRecordings(),points=[...owntracks,...native].sort((a,b)=>a.tst-b.tst);
  const snapshot={schemaVersion:1,date:'2026-10-27',timeZone:'Europe/Berlin',revision:1,updatedAt:now,pointCount:points.length,contentHash:'unchanged',points,journal:buildJournal(points)};
  const before=JSON.stringify(snapshot),result=statisticsFromData({points,archives:[snapshot],from:'2026-10-27',to:'2026-10-28',now});
  assert.deepEqual(result.selectedRecorder,{source:'werktag_ios',device:'native'});assert.equal(result.recorders.length,2);
  assert.equal(result.summary.gps.pointCount,2);assert.ok(result.summary.gps.distanceMetres<70);assert.equal(result.days[0].gps.source.archiveRecorderMismatch,true);
  assert.equal(JSON.stringify(snapshot),before);
  const selected=statisticsFromData({points,from:'2026-10-27',to:'2026-10-28',now,source:'iphone',device:'owntracks'});
  assert.deepEqual(selected.selectedRecorder,{source:'iphone',device:'owntracks'});assert.equal(selected.summary.gps.pointCount,2);
  const days=[...owntracks,...native.map(p=>({...p,tst:p.tst+86400}))];
  const period=statisticsFromData({points:days,from:'2026-10-27',to:'2026-10-28',now});
  assert.equal(period.days[0].gps.present,false);assert.equal(period.days[1].gps.pointCount,2);
  assert.throws(()=>statisticsFromData({points,from:'2026-10-27',to:'2026-10-28',now,source:'iphone',device:'missing'}),e=>e.status===404);
});

test('mixed-source GPX fallback preserves points in separate segments without cross-device legs',()=>{
  const {owntracks,native}=parallelRecordings(),points=[...owntracks,...native].sort((a,b)=>a.tst-b.tst),gpx=gpxForDay('2026-10-27',points);
  const segments=[...gpx.matchAll(/<trkseg>(.*?)<\/trkseg>/g)].map(match=>match[1]);
  assert.equal(segments.length,2);assert.ok(segments.every(segment=>(segment.match(/<trkpt /g)??[]).length===2));
  assert.equal((gpx.match(/<trkpt /g)??[]).length,4);
  assert.ok(!segments[0].includes('lat="52.0002"'));assert.ok(!segments[1].includes('lat="52"'));
});

test('statistics do not match an old context reference against a colliding segment from another recorder',()=>{
  const {owntracks}=parallelRecordings(),other=owntracks.map(p=>({...p,source:'werktag_ios',device:'native'}));
  const segment=selectPoints(owntracks,'2026-10-27').journal.trips[0];
  const context=updateContextValue(null,{date:'2026-10-27',expectedRevision:0,operation:'upsert',entry:{id,kind:'activity',label:'Fahrt',startAt:new Date(segment.startTimestamp*1000).toISOString(),endAt:new Date(segment.endTimestamp*1000).toISOString(),segmentRef:{journalIdAtCreation:segment.id,archiveRevisionAtCreation:null,algorithmVersion:1,startTimestamp:segment.startTimestamp,endTimestamp:segment.endTimestamp,segmentKind:segment.kind,anchorFingerprint:[segment.kind,segment.startTimestamp,segment.endTimestamp,segment.pointCount].join(':')}}},now);
  const single=statisticsFromData({points:owntracks,contexts:[context],from:'2026-10-27',to:'2026-10-27',now});
  assert.equal(single.summary.context.needsReviewCount,0);
  const mixed=statisticsFromData({points:[...owntracks,...other],contexts:[context],from:'2026-10-27',to:'2026-10-27',now});
  assert.equal(mixed.summary.context.needsReviewCount,1);assert.deepEqual(mixed.summary.context.activityLabels,[]);
});
