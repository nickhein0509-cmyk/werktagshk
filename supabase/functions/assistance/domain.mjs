import { buildJournal, clipJournal, dayOf, settings } from './semantics/journal.js';
import { route } from './semantics/route.js';
import { recorderKey, selectRecorder, validateRecorderSelection } from './semantics/recorders.js';
import {
  HEALTH_METRICS,
  HEALTH_SOURCE,
  fail as healthFail,
  newer,
  validHealthDate,
  validateHealthDay,
} from '../_shared/health-contract.mjs';
export { HEALTH_METRICS, HEALTH_SOURCE, validHealthDate, validateHealthDay };
import { archiveRecorderJournals, archiveSelection, archiveSelectionMatches, compareArchivePoints, validateArchiveStructure } from './archive-contract.mjs';
export const berlinDay = dayOf;

export function healthView(healthDays = [], date) {
  const empty={status:'empty',source:HEALTH_SOURCE,date,days:[],fetchedAt:null,sourceLastSyncAt:null,sourceLastDataAt:null,metrics:{}};
  try {
    if(date!=='all'&&!validHealthDate(date))return {...empty,status:'error'};
    const byDate=new Map();
    for(const day of healthDays){validateHealthDay(day,day.date);if(byDate.has(day.date))healthFail('HEALTH_DUPLICATE_DAY');byDate.set(day.date,day);}
    const values=[...byDate.values()], latest=key=>values.reduce((last,d)=>newer(last,d[key]),null);
    const metadata={...empty,days:[...byDate.keys()].sort().reverse(),fetchedAt:latest('fetchedAt'),sourceLastSyncAt:latest('sourceLastSyncAt'),sourceLastDataAt:latest('sourceLastDataAt')};
    if(date==='all')return {...metadata,status:values.length?'ok':'empty'};
    const day=byDate.get(date);return day?{...metadata,status:Object.keys(day.metrics).length?'ok':'empty',fetchedAt:day.fetchedAt,sourceLastSyncAt:day.sourceLastSyncAt??null,sourceLastDataAt:day.sourceLastDataAt??null,metrics:structuredClone(day.metrics)}:metadata;
  }catch{return {...empty,status:'error'};}
}

const TZ = 'Europe/Berlin', MAX_ENTRIES = 500, MAX_FILE = 2 * 1024 * 1024;
const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
function fail(message = 'Ungültige Eingabe.', statusCode = 400, code = 'invalid-context') {
  const error = new Error(message); error.statusCode = statusCode; error.status = statusCode; error.code = code; throw error;
}
function keys(value, allowed) {
  if (!plain(value) || Object.keys(value).some(key => !allowed.includes(key))) fail();
}
export function validateContextDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('Ungültiges Datum.');
  const parsed = new Date(date + 'T00:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date < '2000-01-01' || date > '2100-12-31') fail('Ungültiges Datum.');
  return date;
}
function text(value, max, required = false) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) fail();
  const out = value.trim(); if (required && !out) fail(); return out;
}
function number(value, min, max, integer = false, required = false) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) fail();
  return value;
}
function instant(value, required = false) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || value.length > 40 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) fail('Ungültige Zeitangabe.');
  const out = new Date(value).toISOString();
  // Reject normalized impossible calendar dates, including February 30.
  if (value.slice(0, 10) !== new Date(value.slice(0, 10) + 'T00:00:00Z').toISOString().slice(0, 10)) fail('Ungültige Zeitangabe.');
  return out;
}
function withinDay(value, date) {
  if (value !== undefined && formatter.format(new Date(value)) !== date) fail('Die Startzeit muss zum gewählten Berliner Tag gehören.');
  return value;
}
function interval(input, date) {
  const startAt = withinDay(instant(input.startAt, true), date), endAt = instant(input.endAt, true);
  const duration = Date.parse(endAt) - Date.parse(startAt);
  if (duration < 0 || duration > 48 * 3600000) fail('Ungültiges Zeitintervall.');
  return { startAt, endAt };
}
function segment(value, times) {
  if (value === undefined) return undefined;
  keys(value, ['journalIdAtCreation', 'archiveRevisionAtCreation', 'algorithmVersion', 'startTimestamp', 'endTimestamp', 'segmentKind', 'anchorFingerprint', 'source', 'device']);
  const out = {
    journalIdAtCreation: text(value.journalIdAtCreation, 160, true),
    archiveRevisionAtCreation: value.archiveRevisionAtCreation == null ? null : number(value.archiveRevisionAtCreation, 0, Number.MAX_SAFE_INTEGER, true, true),
    algorithmVersion: number(value.algorithmVersion, 1, 1, true, true),
    startTimestamp: number(value.startTimestamp, 946684800, 4133980799, true, true),
    endTimestamp: number(value.endTimestamp, 946684800, 4133980799, true, true),
    segmentKind: value.segmentKind,
  };
  if (!['trip', 'stay'].includes(out.segmentKind) || out.endTimestamp < out.startTimestamp || Math.abs(Date.parse(times.startAt) / 1000 - out.startTimestamp) > 1 || Math.abs(Date.parse(times.endAt) / 1000 - out.endTimestamp) > 1) fail('Ungültiger Abschnittsbezug.');
  const fingerprint = text(value.anchorFingerprint, 256);
  if (fingerprint !== undefined) out.anchorFingerprint = fingerprint;
  if (value.source !== undefined || value.device !== undefined) Object.assign(out, validateRecorderSelection({ source: value.source, device: value.device }));
  return out;
}
const kindFields = {
  note: ['title', 'at'],
  task: ['title', 'status', 'dueDate'],
  activity: ['label', 'startAt', 'endAt', 'segmentRef'],
  workout: ['sport', 'startAt', 'endAt', 'sets', 'reps', 'rpe'],
  checkin: ['energy', 'mood', 'soreness'],
  hydration: ['amountMl', 'at'],
  nutrition: ['energyKcal', 'proteinG', 'carbsG', 'fatG', 'at'],
  weight: ['kg', 'at'],
  planned_event: ['title', 'startAt', 'endAt'],
};
function normalizeEntry(input, date) {
  if (!plain(input) || !Object.hasOwn(kindFields, input.kind)) fail('Unbekannte Eintragsart.');
  keys(input, ['id', 'kind', 'note', ...kindFields[input.kind]]);
  if (typeof input.id !== 'string' || !UUID.test(input.id)) fail('Ungültige Eintrags-ID.');
  const out = { id: input.id.toLowerCase(), kind: input.kind };
  const note = text(input.note, 2000); if (note !== undefined) out.note = note;
  switch (out.kind) {
    case 'note': {
      if (!out.note) fail('Die Notiz darf nicht leer sein.');
      const title = text(input.title, 120); if (title !== undefined) out.title = title;
      break;
    }
    case 'task':
      out.title = text(input.title, 120, true);
      if (!['open', 'done'].includes(input.status)) fail('Ungültiger Aufgabenstatus.');
      out.status = input.status;
      if (input.dueDate !== undefined) out.dueDate = validateContextDate(input.dueDate);
      break;
    case 'activity': {
      out.label = text(input.label, 120, true); Object.assign(out, interval(input, date));
      const ref = segment(input.segmentRef, out); if (ref) out.segmentRef = ref; break;
    }
    case 'workout':
      if (!['basketball', 'calisthenics', 'skateboarding', 'walking', 'running', 'cycling', 'other'].includes(input.sport)) fail('Unbekannte Sportart.');
      out.sport = input.sport; Object.assign(out, interval(input, date));
      for (const [key, min, max, integer] of [['sets', 1, 200, true], ['reps', 1, 10000, true], ['rpe', 1, 10, false]]) {
        const value = number(input[key], min, max, integer); if (value !== undefined) out[key] = value;
      }
      break;
    case 'checkin':
      for (const key of ['energy', 'mood', 'soreness']) { const value = number(input[key], 1, 5, true); if (value !== undefined) out[key] = value; }
      if (!['energy', 'mood', 'soreness'].some(key => out[key] !== undefined) && !out.note) fail('Der Check-in braucht eine Angabe oder Notiz.');
      break;
    case 'hydration':
      out.amountMl = number(input.amountMl, 1, 10000, false, true); break;
    case 'nutrition':
      out.energyKcal = number(input.energyKcal, 0, 20000, false, true);
      for (const key of ['proteinG', 'carbsG', 'fatG']) { const value = number(input[key], 0, 5000); if (value !== undefined) out[key] = value; }
      break;
    case 'weight':
      out.kg = number(input.kg, 1, 1000, false, true); break;
    case 'planned_event':
      out.title = text(input.title, 120, true); Object.assign(out, interval(input, date)); break;
  }
  if (['note', 'hydration', 'nutrition', 'weight'].includes(out.kind) && input.at !== undefined) out.at = withinDay(instant(input.at, true), date);
  return out;
}
function entryInput(entry) {
  const out = {}; for (const key of ['id', 'kind', 'note', ...(kindFields[entry.kind] ?? [])]) if (entry[key] !== undefined) out[key] = entry[key]; return out;
}

export function emptyContext(date){validateContextDate(date);return {schemaVersion:1,date,timezone:TZ,revision:0,updatedAt:null,entries:[]};}
export function validateContextValue(value,date){
  validateContextDate(date);
  try{
    if(!plain(value)||value.schemaVersion!==1||value.date!==date||value.timezone!==TZ||!Number.isSafeInteger(value.revision)||value.revision<0||!Array.isArray(value.entries)||value.entries.length>MAX_ENTRIES)throw Error();
    if(value.revision===0){if(value.updatedAt!==null||value.entries.length)throw Error();return value;}
    if(!Number.isFinite(Date.parse(value.updatedAt)))throw Error();
    const ids=new Set();for(const entry of value.entries){
      if(!plain(entry)||ids.has(entry.id)||!plain(entry.source)||entry.source.provider!=='MANUAL'||entry.source.sourceId!==null||!Number.isFinite(Date.parse(entry.createdAt))||!Number.isFinite(Date.parse(entry.updatedAt))||!Number.isSafeInteger(entry.revision)||entry.revision<1)throw Error();
      normalizeEntry(entryInput(entry),date);ids.add(entry.id);
    }
    return value;
  }catch{fail('Kontextdaten sind beschädigt; sie wurden nicht überschrieben.',500,'context-storage');}
}

export function contextView(value, journal, recorderJournals) {
  const out = structuredClone(value);
  const fallbackAvailable = journal && Array.isArray(journal.trips) && Array.isArray(journal.stays);
  out.entries = out.entries.map(entry => {
    if (entry.kind !== 'activity' || !entry.segmentRef) return entry;
    const ref = entry.segmentRef;
    let available = fallbackAvailable, selectedJournal = journal;
    if (Array.isArray(recorderJournals)) {
      if (ref.source !== undefined || ref.device !== undefined) {
        const matches = recorderJournals.filter(value => value.source === ref.source && value.device === ref.device);
        available = matches.length === 1; selectedJournal = available ? matches[0].journal : null;
      } else {
        available = recorderJournals.length === 1 && Boolean(recorderJournals[0].journal); selectedJournal = available ? recorderJournals[0].journal : null;
      }
    }
    const segments = available ? [...selectedJournal.trips, ...selectedJournal.stays] : [];
    const matches = segments.filter(item => item.id === ref.journalIdAtCreation && item.kind === ref.segmentKind && item.startTimestamp === ref.startTimestamp && item.endTimestamp === ref.endTimestamp && (!ref.anchorFingerprint || ref.anchorFingerprint === [item.kind, item.startTimestamp, item.endTimestamp, item.pointCount].join(':')));
    return { ...entry, needsReview: !available || matches.length !== 1, segmentStatus: !available ? 'unverified' : matches.length === 1 ? 'matched' : 'needs-review' };
  });
  return out;
}

export function updateContextValue(previous,input,nowISO=new Date().toISOString()){
  keys(input,['date','expectedRevision','operation','entry','id']);const date=validateContextDate(input.date);
  if(!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||!['upsert','delete'].includes(input.operation))fail();
  let normalized,id;
  if(input.operation==='upsert'){if(input.id!==undefined)fail();normalized=normalizeEntry(input.entry,date);id=normalized.id;}
  else{if(input.entry!==undefined||typeof input.id!=='string'||!UUID.test(input.id))fail();id=input.id.toLowerCase();}
  previous=previous==null?emptyContext(date):validateContextValue(previous,date);
  const index=previous.entries.findIndex(entry=>entry.id===id),existing=previous.entries[index];
  if(input.operation==='delete'&&index===-1)return structuredClone(previous);
  if(existing&&normalized&&JSON.stringify(normalizeEntry(entryInput(existing),date))===JSON.stringify(normalized))return structuredClone(previous);
  if(previous.revision!==input.expectedRevision)fail('Der Tag wurde inzwischen geändert. Bitte neu laden.',409,'context-conflict');
  if(existing&&normalized&&existing.kind!==normalized.kind)fail('Die Eintragsart kann nicht geändert werden.');
  if(input.operation==='upsert'&&index===-1&&previous.entries.length>=MAX_ENTRIES)fail('Zu viele Einträge an diesem Tag.',413,'context-limit');
  const now=instant(nowISO,true),entries=structuredClone(previous.entries);
  if(input.operation==='delete')entries.splice(index,1);else{const saved={...normalized,source:{provider:'MANUAL',sourceId:null},createdAt:existing?.createdAt??now,updatedAt:now,revision:(existing?.revision??0)+1};if(index===-1)entries.push(saved);else entries[index]=saved;}
  const value={schemaVersion:1,date,timezone:TZ,revision:previous.revision+1,updatedAt:now,entries};
  if(new TextEncoder().encode(JSON.stringify(value,null,2)+'\n').length>MAX_FILE)fail('Zu viele Kontextdaten.',413,'context-limit');return value;
}

export function validateContextRange(from, to) {
  validateContextDate(from); validateContextDate(to);
  if (from > to || (Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000 + 1 > 90) {
    fail('Bitte einen Zeitraum von höchstens 90 Tagen wählen.');
  }
  return { from, to };
}

export function contextRange(values, from, to) {
  validateContextRange(from, to);
  if (!Array.isArray(values)) fail('Tageseinträge sind vorübergehend nicht verfügbar.', 503, 'context-storage');
  const documents = [], dates = new Set(); let count = 0;
  for (const value of values) {
    try { validateContextValue(value, value?.date); }
    catch { fail('Tageseinträge sind beschädigt.', 503, 'context-storage'); }
    if (dates.has(value.date)) fail('Tageseinträge sind beschädigt.', 503, 'context-storage');
    dates.add(value.date);
    if (value.date < from || value.date > to) continue;
    const entries = value.entries.filter(entry => ['note', 'task'].includes(entry.kind)).map(entry => ({
      ...normalizeEntry(entryInput(entry), value.date),
      source: { provider: 'MANUAL', sourceId: null },
      createdAt: entry.createdAt, updatedAt: entry.updatedAt, revision: entry.revision,
    }));
    count += entries.length;
    if (count > 2000) fail('Zu viele Notizen oder Aufgaben. Bitte den Zeitraum verkleinern.', 413, 'context-range-limit');
    documents.push({ date: value.date, revision: value.revision, entries });
  }
  documents.sort((a, b) => a.date.localeCompare(b.date));
  const result = { schemaVersion: 1, timezone: TZ, from, to, documents };
  // Leave room below the gateway's 4 MiB response limit, including UTF-8 text.
  if (new TextEncoder().encode(JSON.stringify(result)).length > 3 * 1024 * 1024) {
    fail('Zu viele Notizen oder Aufgaben. Bitte den Zeitraum verkleinern.', 413, 'context-range-limit');
  }
  return result;
}

export function selectPoints(rows, date, limit = 20000, options = {}) {
  const selection = selectRecorder(rows, point => date === 'all' || berlinDay(point.tst) === date, options);
  const ordered = [...selection.rows].sort(compareArchivePoints);
  const days = [...new Set(rows.map(r => berlinDay(r.tst)))].sort().reverse();
  const all = ordered.filter(r => date === 'all' || berlinDay(r.tst) === date);
  const selected = all.slice(-limit), from=selected.length?ordered.indexOf(selected[0]):0, to=selected.length?ordered.indexOf(selected.at(-1)):-1;
  const journal=clipJournal(buildJournal(ordered),ordered,from,to);
  return { date, days, totalStored: rows.length, totalSelected: all.length, truncated: selected.length < all.length, journal,
    recorders: selection.recorders, selectedRecorder: selection.selectedRecorder,
    latestSourceTimestamp: rows.reduce((last, r) => Math.max(last ?? 0, r.tst), null),
    latestReceivedAt: rows.reduce((last, r) => !last || Date.parse(r.receivedAt) > Date.parse(last) || (Date.parse(r.receivedAt) === Date.parse(last) && r.receivedAt > last) ? r.receivedAt : last, null),
    points: selected.map(({ id, source, device, tst, lat, lon, acc, alt, vel, cog, batt, receivedAt }) => ({ id, source, device, tst, lat, lon, acc, alt, vel, cog, batt, receivedAt })) };
}


export function gpxForDay(date,points,{schemaVersion=1}={}){
  let part=[],previous=null;const segments=[];
  const flush=()=>{if(part.length)segments.push(part);part=[];previous=null;};
  // A fallback export of an old mixed snapshot must keep each device's track
  // separate. Stored GPX files and original snapshots are never rewritten.
  const groups=new Map();for(const p of points){const key=recorderKey(p);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
  for(const group of groups.values()){
   flush();
   for(const p of group){
    if(p.acc>100){flush();continue;}
    if(previous){const dt=p.tst-previous.tst;
      // Same gap rules as the map; never bridge a missing recording.
      const a=previous,b=p,r=Math.PI/180,h=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lon-a.lon)*r/2)**2;
      const dist=12742000*Math.asin(Math.sqrt(Math.min(1,h)));
      if(dt<=0||dt>900||dist/dt>70)flush();
    }
    part.push(p);previous=p;
   }
  }
  flush();
  const v2=schemaVersion===2,creator=v2?'WerkTag GPS Journal archive-v2':'Nick GPS Journal',metadata=v2?'<metadata><name>WerkTag Tagesarchiv v2 · '+date+'</name></metadata>':'';
  return '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="'+creator+'" xmlns="http://www.topografix.com/GPX/1/1">'+metadata+'<trk><name>Nick '+date+'</name>'+segments.map(s=>'<trkseg>'+s.map(p=>'<trkpt lat="'+p.lat+'" lon="'+p.lon+'">'+(Number.isFinite(p.alt)?'<ele>'+p.alt+'</ele>':'')+'<time>'+new Date(p.tst*1000).toISOString()+'</time></trkpt>').join('')+'</trkseg>').join('')+'</trk></gpx>\n';
}

export const STATISTICS_VERSION = 'statistics-v1';
const DAY = 86400000;
const GPS_FIELDS = ['pointCount','tripCount','stayCount','distanceMetres','tripObservedSeconds','stayObservedSeconds','uncertain','gaps'];
const SLEEP = ['sleep_analysis_core_seconds','sleep_analysis_deep_seconds','sleep_analysis_rem_seconds'];
function statisticsFail(code,statusCode=503){const error=new Error(code);error.code=code;error.statusCode=statusCode;throw error;}
function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
function shift(date,days){return new Date(Date.parse(date+'T00:00:00Z')+days*DAY).toISOString().slice(0,10);}
function datesBetween(from,to){const dates=[];for(let d=from;d<=to;d=shift(d,1))dates.push(d);return dates;}
function metricUnits(){return {...HEALTH_METRICS,sleep_total_seconds:'s'};}
function metricType(name){return name==='vo2_max'?'latest-observation':name.endsWith('_total')||name.endsWith('_seconds')?'sum':'mean-of-daily-values';}
function emptyGps(){return {present:false,...Object.fromEntries(GPS_FIELDS.map(key=>[key,null])),source:null};}
function emptyMetrics(){return Object.fromEntries(Object.entries(metricUnits()).map(([key,unit])=>[key,{value:null,unit,present:false}]));}
function gpsSummary(points,journal,source){
  const quality=route(points);
  return {present:points.length>0,pointCount:points.length,tripCount:journal.trips.length,stayCount:journal.stays.length,distanceMetres:quality.distance,
    tripObservedSeconds:journal.trips.reduce((sum,row)=>sum+row.durationSeconds,0),stayObservedSeconds:journal.stays.reduce((sum,row)=>sum+row.durationSeconds,0),
    uncertain:quality.uncertain,gaps:quality.gaps,source};
}
function validRows(points,date){
  if(!Array.isArray(points))statisticsFail('STATISTICS_INVALID_ARCHIVE');
  for(let i=0;i<points.length;i++){
    const p=points[i];
    if(!p||!Number.isSafeInteger(p.tst)||!Number.isFinite(p.lat)||Math.abs(p.lat)>90||!Number.isFinite(p.lon)||Math.abs(p.lon)>180||!Number.isFinite(Date.parse(p.receivedAt))||dayOf(p.tst)!==date)statisticsFail('STATISTICS_INVALID_ARCHIVE');
    if(i&&compareArchivePoints(points[i-1],p)>0)statisticsFail('STATISTICS_INVALID_ARCHIVE');
  }
}
function healthSummary(healthDays,date){
  const day=healthDays.find(day=>day.date===date),metrics=emptyMetrics();
  if(day)validateHealthDay(day,date);
  if(!day)return {present:false,metrics,fetchedAt:null,sourceLastSyncAt:null,sourceLastDataAt:null};
  for(const [key,metric] of Object.entries(day.metrics)){if(metrics[key]){
    metrics[key]={value:metric.value,unit:metric.unit,present:true};
    if(key==='vo2_max')Object.assign(metrics[key],{aggregation:'latest-observation',observedAt:metric.observedAt,observedAtPrecision:metric.observedAtPrecision,sourceDevice:metric.sourceDevice});
  }}
  if(SLEEP.every(key=>metrics[key]?.present))metrics.sleep_total_seconds={value:SLEEP.reduce((sum,key)=>sum+metrics[key].value,0),unit:'s',present:true,derivedFrom:[...SLEEP]};
  return {present:Object.values(metrics).some(m=>m.present),metrics,fetchedAt:day.fetchedAt,sourceLastSyncAt:day.sourceLastSyncAt,sourceLastDataAt:day.sourceLastDataAt};
}


const CONTEXT_KINDS=['note','task','activity','workout','checkin','hydration','nutrition','weight','planned_event'];
function manualValues(entries,key,aggregation='sum-of-manual-entries'){
  const values=entries.map(e=>e[key]).filter(Number.isFinite),sum=values.reduce((a,b)=>a+b,0);
  return {value:values.length?(aggregation==='mean-of-self-reports'?sum/values.length:sum):null,count:values.length,aggregation};
}
function contextSummary(records){
  const rows=records.flatMap(({date,value})=>value.entries.map(entry=>({date,entry})));
  const counts=Object.fromEntries(CONTEXT_KINDS.map(kind=>[kind,rows.filter(r=>r.entry.kind===kind).length]));
  const activities=new Map(),sports=new Map();let needsReviewCount=0;
  for(const {entry} of rows){
    const seconds=entry.startAt&&entry.endAt?(Date.parse(entry.endAt)-Date.parse(entry.startAt))/1000:0;
    if(entry.kind==='activity'){
      if(entry.segmentRef&&(entry.needsReview||entry.segmentStatus!=='matched')){needsReviewCount++;continue;}
      if(!activities.has(entry.label))activities.set(entry.label,{label:entry.label,count:0,durationSeconds:0,source:'MANUAL'});
      const row=activities.get(entry.label);row.count++;row.durationSeconds+=seconds;
    }
    if(entry.kind==='workout'){
      if(!sports.has(entry.sport))sports.set(entry.sport,[]);
      sports.get(entry.sport).push(entry);
    }
  }
  const workouts=[...sports].map(([sport,entries])=>({sport,count:entries.length,durationSeconds:entries.reduce((sum,e)=>sum+(Date.parse(e.endAt)-Date.parse(e.startAt))/1000,0),sets:manualValues(entries,'sets'),reps:manualValues(entries,'reps'),rpe:manualValues(entries,'rpe','mean-of-self-reports'),source:'MANUAL'})).sort((a,b)=>a.sport.localeCompare(b.sport));
  const checkins=rows.filter(r=>r.entry.kind==='checkin').map(r=>r.entry),hydration=rows.filter(r=>r.entry.kind==='hydration').map(r=>r.entry),nutrition=rows.filter(r=>r.entry.kind==='nutrition').map(r=>r.entry);
  const weights=rows.filter(r=>r.entry.kind==='weight').sort((a,b)=>a.date.localeCompare(b.date));
  let weight=null;
  if(weights.length){
    const latestDate=weights.at(-1).date,candidates=weights.filter(r=>r.date===latestDate),allTimed=candidates.every(r=>r.entry.at);
    candidates.sort((a,b)=>Date.parse(allTimed?a.entry.at:a.entry.updatedAt)-Date.parse(allTimed?b.entry.at:b.entry.updatedAt)||a.entry.id.localeCompare(b.entry.id));
    const selected=candidates.at(-1);
    weight={kg:selected.entry.kg,date:selected.date,observedAt:selected.entry.at??null,aggregation:'latest-dated-entry',selectionBasis:allTimed?'observation-time':'entry-update-within-day',chronologyAmbiguous:!allTimed&&candidates.length>1,count:weights.length,source:'MANUAL'};
  }
  return {source:'MANUAL',present:rows.length>0,entryCount:rows.length,counts,activityLabels:[...activities.values()].sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label)),workouts,
    checkin:Object.fromEntries(['energy','mood','soreness'].map(key=>[key,manualValues(checkins,key,'mean-of-self-reports')])),
    hydration:{amountMl:manualValues(hydration,'amountMl').value,count:hydration.length,aggregation:'sum-of-manual-entries'},
    nutrition:Object.fromEntries(['energyKcal','proteinG','carbsG','fatG'].map(key=>[key,manualValues(nutrition,key)])),weight,
    planned:{count:counts.planned_event,durationSeconds:rows.filter(r=>r.entry.kind==='planned_event').reduce((sum,r)=>sum+(Date.parse(r.entry.endAt)-Date.parse(r.entry.startAt))/1000,0)},
    needsReviewCount,durationAttribution:'entry-date',references:records.map(({date,value})=>({date,revision:value.revision,updatedAt:value.updatedAt}))};
}

function period(date,bucket){
  if(bucket==='day')return {key:date,start:date,end:date};
  if(bucket==='week'){const weekday=new Date(date+'T00:00:00Z').getUTCDay();const start=shift(date,-((weekday+6)%7));return {key:start,start,end:shift(start,6)};}
  const start=date.slice(0,7)+'-01';const next=new Date(start+'T00:00:00Z');next.setUTCMonth(next.getUTCMonth()+1);
  return {key:date.slice(0,7),start,end:shift(next.toISOString().slice(0,10),-1)};
}
function aggregate(days,{key,start,end},contextRecords=[]){
  const first=days[0].date,last=days.at(-1).date,gpsDays=days.filter(d=>d.gps.present);
  const gps={present:gpsDays.length>0,presentDays:gpsDays.length,missingDays:days.length-gpsDays.length,partial:gpsDays.length<days.length||days.some(d=>d.provisional)};
  for(const field of GPS_FIELDS)gps[field]=gpsDays.length?gpsDays.reduce((sum,d)=>sum+d.gps[field],0):null;
  const metrics={};
  for(const [name,unit] of Object.entries(metricUnits())){
    const present=days.filter(d=>d.health.metrics[name]?.present),aggregation=metricType(name);
    const total=present.reduce((sum,d)=>sum+d.health.metrics[name].value,0);
    const latest=aggregation==='latest-observation'&&present.length?[...present].sort((a,b)=>Date.parse(a.health.metrics[name].observedAt)-Date.parse(b.health.metrics[name].observedAt)).at(-1).health.metrics[name]:null;
    if(latest&&present.some(d=>d.health.metrics[name].observedAt===latest.observedAt&&d.health.metrics[name].value!==latest.value))statisticsFail('STATISTICS_AMBIGUOUS_OBSERVATION');
    metrics[name]={value:present.length?(aggregation==='sum'?total:latest?latest.value:total/present.length):null,unit,aggregation,presentDays:present.length,missingDays:days.length-present.length,provisionalDays:present.filter(d=>d.provisional).length,partial:present.length<days.length||days.some(d=>d.provisional)};
    if(latest)Object.assign(metrics[name],{observedAt:latest.observedAt,observedAtPrecision:latest.observedAtPrecision,sourceDevice:latest.sourceDevice});
  }
  return {key,from:first,to:last,periodStart:start,periodEnd:end,partial:first!==start||last!==end||gps.partial||Object.values(metrics).some(m=>m.partial),provisional:days.some(d=>d.provisional),dayCount:days.length,gps,health:{present:days.some(d=>d.health.present),metrics},context:contextSummary(contextRecords)};
}

export function statisticsFromData({points=[],healthDays=[],contexts=[],archives=[],from,to,bucket='day',now=Date.now(),source,device}={}){
  if(typeof now==='string')now=Date.parse(now);if(!Number.isFinite(now))statisticsFail('STATISTICS_INVALID_TIME',400);
  const today=dayOf(now/1000);to=to??today;if(!validDate(to))statisticsFail('STATISTICS_INVALID_RANGE',400);from=from??shift(to,-6);
  if(!validDate(from)||from>to||to>today||!['day','week','month'].includes(bucket))statisticsFail('STATISTICS_INVALID_RANGE',400);
  if((Date.parse(to)-Date.parse(from))/DAY+1>366)statisticsFail('STATISTICS_RANGE_TOO_LARGE',400);
  const selection=selectRecorder(points,p=>{const date=dayOf(p.tst);return date>=from&&date<=to;},{source,device});
  const dates=datesBetween(from,to),rows=[...selection.rows].sort(compareArchivePoints),journal=buildJournal(rows),days=[],records=[];
  const dayRecorders=new Map();for(const p of points){const date=dayOf(p.tst);if(date<from||date>to)continue;if(!dayRecorders.has(date))dayRecorders.set(date,new Set());dayRecorders.get(date).add(recorderKey(p));}
  for(const date of dates){
    const saved=archives.find(a=>a.date===date);let selected,dayJournal,source,gps;
    const fromIndex=rows.findIndex(p=>dayOf(p.tst)===date);let toIndex=fromIndex;
    while(toIndex>=0&&toIndex+1<rows.length&&dayOf(rows[toIndex+1].tst)===date)toIndex++;
    const livePoints=fromIndex<0?[]:rows.slice(fromIndex,toIndex+1);validRows(livePoints,date);
    const liveJournal=livePoints.length?clipJournal(journal,rows,fromIndex,toIndex):null;
    let snapshotOlder=false,recorderMismatch=false,savedSelection=null;
    if(saved){
      try{validateArchiveStructure(saved,date);}catch{statisticsFail('STATISTICS_INVALID_ARCHIVE');}
      if(!Number.isFinite(Date.parse(saved.updatedAt))||saved.pointCount!==saved.points.length)statisticsFail('STATISTICS_INVALID_ARCHIVE');
      validRows(saved.points,date);savedSelection=archiveSelection(saved,selection.selectedKey);recorderMismatch=savedSelection.recorderMismatch;
      snapshotOlder=!recorderMismatch&&!archiveSelectionMatches(saved,selection.selectedKey,livePoints,liveJournal);
    }
    if(saved&&!snapshotOlder&&!recorderMismatch){selected=savedSelection.points;dayJournal=savedSelection.journal;source={kind:'archive',schemaVersion:saved.schemaVersion,revision:saved.revision,contentHash:saved.contentHash??null,updatedAt:saved.updatedAt,settings:dayJournal.settings};}
    else{selected=livePoints;dayJournal=liveJournal;source={kind:snapshotOlder?'cloud-derived':date===today?'live':'cloud-derived',revision:null,contentHash:null,updatedAt:selected.reduce((latest,p)=>!latest||Date.parse(p.receivedAt)>Date.parse(latest)||(Date.parse(p.receivedAt)===Date.parse(latest)&&p.receivedAt>latest)?p.receivedAt:latest,null),settings,...(snapshotOlder?{archiveSnapshotOlder:true}: {}),...(recorderMismatch?{archiveRecorderMismatch:true}: {})};}
    gps=selected.length?gpsSummary(selected,dayJournal,source):emptyGps();
    // New references resolve against their exact recorder. Legacy references
    // remain matchable only while the day has one unambiguous recorder.
    let referenceJournals=[];
    try{referenceJournals=archiveRecorderJournals(points,date,{allowLegacy:true});}catch{if((dayRecorders.get(date)?.size??0)===1&&dayJournal)referenceJournals=[{journal:dayJournal}];}
    const value=contexts.find(value=>value.date===date)??emptyContext(date);validateContextValue(value,date);const record={date,value:contextView(value,null,referenceJournals)};records.push(record);
    days.push({date,provisional:date===today,gps,health:healthSummary(healthDays,date),context:contextSummary([record])});
  }
  const grouped=new Map();for(const day of days){const p=period(day.date,bucket);if(!grouped.has(p.key))grouped.set(p.key,{p,days:[]});grouped.get(p.key).days.push(day);}
  const buckets=[...grouped.values()].map(({p,days})=>aggregate(days,p,records.filter(r=>days.some(d=>d.date===r.date))));
  const quality={totalDays:days.length,presentGpsDays:days.filter(d=>d.gps.present).length,missingGpsDays:days.filter(d=>!d.gps.present).length,presentHealthDays:days.filter(d=>d.health.present).length,missingHealthDays:days.filter(d=>!d.health.present).length,provisional:days.some(d=>d.provisional)};quality.partial=quality.provisional||quality.missingGpsDays>0||quality.missingHealthDays>0;
  return {schemaVersion:1,algorithmVersion:STATISTICS_VERSION,timeZone:'Europe/Berlin',from,to,bucket,computedAt:new Date(now).toISOString(),inputFingerprint:null,recorders:selection.recorders,selectedRecorder:selection.selectedRecorder,days,buckets,summary:aggregate(days,{key:'selection',start:from,end:to},records),quality};
}
