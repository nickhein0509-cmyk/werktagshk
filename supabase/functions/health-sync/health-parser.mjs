// Extracted without semantic changes from the existing GPS health.mjs contract.
export const HEALTH_SOURCE = 'Apple Health via Freddy';
export const HEALTH_METRICS = Object.freeze({
  steps_total:'count', active_energy_total:'kcal', basal_energy_total:'kcal',
  distance_walk_run_total:'m', exercise_time_total:'min', stand_time_total:'min',
  flights_climbed_total:'count', heart_rate_merged_avg:'bpm',
  resting_heart_rate_merged_avg:'bpm', hrv_sdnn_merged_avg:'ms_sdnn',
  sleep_analysis_core_seconds:'s', sleep_analysis_deep_seconds:'s', sleep_analysis_rem_seconds:'s',
  time_in_daylight_total:'min', respiratory_rate_merged_avg:'count/min', vo2_max:'ml/kg/min'
});
const own = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
const fail = code => { const error = new Error(code); error.code=code; throw error; };
export const validHealthDate = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
const timestamp = value => {
  if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) fail('HEALTH_INVALID_TIMESTAMP');
  return new Date(value).toISOString();
};
const optionalTimestamp = value => value==null ? null : timestamp(value);
const newer = (left,right) => !left ? right : !right ? left : Date.parse(left)>=Date.parse(right)?left:right;
function validateObservation(value){
  if(!value || !Number.isFinite(value.value) || value.value<0 || value.unit!=='ml/kg/min' || typeof value.sourceDevice!=='string' || !value.sourceDevice || value.sourceDevice.length>256 || /[\r\n\0]/.test(value.sourceDevice) || value.sourceDevice==='Merged (HealthKit daily statistics)')fail('HEALTH_INVALID_OBSERVATION');
  timestamp(value.observedAt);timestamp(value.updatedAt);
  if(!['minute','second','millisecond'].includes(value.observedAtPrecision) || typeof value.sourceTimestamp!=='string' || !value.sourceTimestamp || value.sourceTimestamp.length>80 || /[\r\n\0]/.test(value.sourceTimestamp))fail('HEALTH_INVALID_OBSERVATION');
}
function makeObservationMetric(observations,updatedAt){
  if(!Array.isArray(observations)||!observations.length||observations.length>1000)fail('HEALTH_INVALID_OBSERVATION');
  for(const value of observations)validateObservation(value);
  const ordered=[...observations].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt)||a.sourceDevice.localeCompare(b.sourceDevice));
  const latest=ordered.at(-1),ties=ordered.filter(value=>value.observedAt===latest.observedAt);
  if(ties.some(value=>value.value!==latest.value))fail('HEALTH_AMBIGUOUS_OBSERVATION');
  return {...latest,updatedAt,aggregation:'latest-observation',observations:ordered};
}
function parseObservation(beforeDevice,unit,date,metric){
  const tail=beforeDevice.slice(unit.length).trim();
  const matched=/^@\s+((?:(\d{4}-\d{2}-\d{2})T)?(\d{2}):(\d{2})(?::(\d{2})(\.\d{1,3})?)?\s+UTC([+-])(\d{2}):(\d{2}))$/.exec(tail);
  if(!matched)fail('HEALTH_OBSERVATION_TIME_REQUIRED');
  const sampleDate=matched[2]??date,hour=Number(matched[3]),minute=Number(matched[4]),second=Number(matched[5]??0),offsetHour=Number(matched[8]),offsetMinute=Number(matched[9]);
  if(!validHealthDate(sampleDate)||hour>23||minute>59||second>59||offsetHour>14||offsetMinute>59||(offsetHour===14&&offsetMinute!==0))fail('HEALTH_INVALID_OBSERVATION_TIME');
  const iso=sampleDate+'T'+matched[3]+':'+matched[4]+':'+(matched[5]??'00')+(matched[6]??'')+matched[7]+matched[8]+':'+matched[9];
  return {...metric,observedAt:timestamp(iso),observedAtPrecision:matched[6]?'millisecond':matched[5]?'second':'minute',sourceTimestamp:matched[1]};
}
function combineObservationMetrics(old,incoming){
  const values=new Map();
  for(const observation of [...(old?.observations??[]),...incoming.observations]){
    const key=observation.observedAt+'\0'+observation.sourceDevice,previous=values.get(key);
    if(!previous||Date.parse(observation.updatedAt)>Date.parse(previous.updatedAt))values.set(key,observation);
  }
  return makeObservationMetric([...values.values()],newer(old?.updatedAt,incoming.updatedAt));
}

function validateMetric(key,value){
  if(!own(HEALTH_METRICS,key) || !value || !Number.isFinite(value.value) || value.value<0 || value.unit!==HEALTH_METRICS[key] || typeof value.sourceDevice!=='string' || !value.sourceDevice || value.sourceDevice.length>256 || /[\r\n\0]/.test(value.sourceDevice)) fail('HEALTH_INVALID_RECORD');
  timestamp(value.updatedAt);
  if(key==='vo2_max'){
    const rebuilt=makeObservationMetric(value.observations,value.updatedAt);
    if(value.aggregation!=='latest-observation'||value.value!==rebuilt.value||value.unit!==rebuilt.unit||value.sourceDevice!==rebuilt.sourceDevice||value.observedAt!==rebuilt.observedAt||value.observedAtPrecision!==rebuilt.observedAtPrecision||value.sourceTimestamp!==rebuilt.sourceTimestamp)fail('HEALTH_INVALID_OBSERVATION');
  }
  if((key.endsWith('_total')||key.includes('_merged_')) && !/^Merged \(HealthKit daily statistics\)$/.test(value.sourceDevice)) fail('HEALTH_NON_MERGED_RECORD');
}
function validateDay(value,date){
  if(!value || value.schemaVersion!==1 || value.date!==date || value.provider!=='APPLE_HEALTH' || value.timezone!=='Europe/Berlin' || value.source!==HEALTH_SOURCE || !value.metrics || typeof value.metrics!=='object' || Array.isArray(value.metrics)) fail('HEALTH_INVALID_STORE');
  timestamp(value.fetchedAt);optionalTimestamp(value.sourceLastSyncAt);optionalTimestamp(value.sourceLastDataAt);
  for(const [key,metric] of Object.entries(value.metrics))validateMetric(key,metric);
  return value;
}

function validateIndex(value){
  if(!value)return null;
  if(value.schemaVersion!==1||value.source!==HEALTH_SOURCE||value.provider!=='APPLE_HEALTH'||value.timezone!=='Europe/Berlin'||!Array.isArray(value.days))fail('HEALTH_INVALID_INDEX');
  timestamp(value.fetchedAt);optionalTimestamp(value.sourceLastSyncAt);optionalTimestamp(value.sourceLastDataAt);
  const seen=new Set();
  for(const entry of value.days){
    if(!entry||!validHealthDate(entry.date)||seen.has(entry.date)||!Number.isSafeInteger(entry.metricCount)||entry.metricCount<0||entry.metricCount>Object.keys(HEALTH_METRICS).length)fail('HEALTH_INVALID_INDEX');
    timestamp(entry.fetchedAt);seen.add(entry.date);
  }
  return value;
}

export function parseFreddyHealthSnapshot(input){
  if(!input || input.schemaVersion!==1 || input.provider!=='APPLE_HEALTH' || input.timezone!=='Europe/Berlin' || typeof input.queryText!=='string' || input.queryText.length>2*1024*1024)fail('HEALTH_INVALID_INPUT');
  const fetchedAt=timestamp(input.fetchedAt),sourceLastSyncAt=optionalTimestamp(input.sourceLastSyncAt),sourceLastDataAt=optionalTimestamp(input.sourceLastDataAt);
  if(!/^\s*(?:Health data\b|No (?:health )?data\b)/i.test(input.queryText) || /\b(?:truncated|more records omitted)\b/i.test(input.queryText))fail('HEALTH_INCOMPLETE_QUERY');
  const knownName=new RegExp('\\b('+Object.keys(HEALTH_METRICS).join('|')+')\\b');
  const explicitlyEmpty=/\bno (?:health )?data\b|\bno (?:matching )?(?:records|readings|results)\b/i.test(input.queryText);
  const days=new Map();let date=null;
  for(const line of input.queryText.split(/\r?\n/)){
    const heading=/^(\d{4}-\d{2}-\d{2}):\s*$/.exec(line);
    if(heading){if(!validHealthDate(heading[1]))fail('HEALTH_INVALID_DATE');date=heading[1];continue;}
    if(/^\d{4}-\d{2}-\d{2}/.test(line))fail('HEALTH_INVALID_DATE');
    const mentioned=knownName.exec(line);
    if(!mentioned)continue;
    const named=/^\s+([a-z][a-z0-9_]*):/.exec(line);
    if(!named || !own(HEALTH_METRICS,named[1]) || named[1]!==mentioned[1])fail('HEALTH_INVALID_RECORD');
    if(!date)fail('HEALTH_MISSING_DATE');
    const matched=/^\s+([a-z][a-z0-9_]*):\s+([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(.*)$/i.exec(line);
    if(!matched || !Number.isFinite(Number(matched[2])) || Number(matched[2])<0)fail('HEALTH_INVALID_VALUE');
    const key=matched[1],device=/\(Apple Health\s*[·•]\s*(.+)\)\s*$/.exec(matched[3]);
    if(!device)fail('HEALTH_INVALID_SOURCE');
    const beforeDevice=matched[3].slice(0,device.index).trim(),expected=HEALTH_METRICS[key];
    const reportedUnit=(beforeDevice.split(/\s+/)[0]??'');
    if(expected==='s'){
      if(reportedUnit && !['@','s','sec','seconds'].includes(reportedUnit))fail('HEALTH_INVALID_UNIT');
    }else if(reportedUnit!==expected)fail('HEALTH_INVALID_UNIT');
    let metric={value:Number(matched[2]),unit:expected,sourceDevice:device[1],updatedAt:fetchedAt};
    if(key==='vo2_max')metric=makeObservationMetric([parseObservation(beforeDevice,expected,date,metric)],fetchedAt);
    validateMetric(key,metric);
    if(!days.has(date))days.set(date,Object.create(null));
    const metrics=days.get(date);
    if(key==='vo2_max'&&own(metrics,key)){
      const observation=metric.observations[0],previous=metrics[key].observations.find(value=>value.observedAt===observation.observedAt&&value.sourceDevice===observation.sourceDevice);
      if(previous&&previous.value!==observation.value)fail('HEALTH_AMBIGUOUS_OBSERVATION');
      metrics[key]=combineObservationMetrics(metrics[key],metric);
    }else{
      if(own(metrics,key) && JSON.stringify(metrics[key])!==JSON.stringify(metric))fail('HEALTH_AMBIGUOUS_DUPLICATE');
      metrics[key]=metric;
    }
  }
  if(days.size===0&&!explicitlyEmpty)fail('HEALTH_INCOMPLETE_QUERY');
  return {fetchedAt,sourceLastSyncAt,sourceLastDataAt,days};
}
