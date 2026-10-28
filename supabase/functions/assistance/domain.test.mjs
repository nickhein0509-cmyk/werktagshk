import test from 'node:test';
import assert from 'node:assert/strict';
import {selectPoints,berlinDay,healthView,validateHealthDay,emptyContext,updateContextValue,validateContextValue,contextView,statisticsFromData,gpxForDay} from './domain.mjs';

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
