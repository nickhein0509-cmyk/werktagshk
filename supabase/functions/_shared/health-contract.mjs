// Pure ECMAScript/Web API contract shared by Supabase Edge functions and Node tests.
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
export const fail = code => { const error = new Error(code); error.code=code; throw error; };
export const validHealthDate = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
export const timestamp = value => {
  if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) fail('HEALTH_INVALID_TIMESTAMP');
  return new Date(value).toISOString();
};
export const optionalTimestamp = value => value==null ? null : timestamp(value);
export const newer = (left,right) => !left ? right : !right ? left : Date.parse(left)>=Date.parse(right)?left:right;
function validateObservation(value){
  if(!value || !Number.isFinite(value.value) || value.value<0 || value.unit!=='ml/kg/min' || typeof value.sourceDevice!=='string' || !value.sourceDevice || value.sourceDevice.length>256 || /[\r\n\0]/.test(value.sourceDevice) || value.sourceDevice==='Merged (HealthKit daily statistics)')fail('HEALTH_INVALID_OBSERVATION');
  timestamp(value.observedAt);timestamp(value.updatedAt);
  if(!['minute','second','millisecond'].includes(value.observedAtPrecision) || typeof value.sourceTimestamp!=='string' || !value.sourceTimestamp || value.sourceTimestamp.length>80 || /[\r\n\0]/.test(value.sourceTimestamp))fail('HEALTH_INVALID_OBSERVATION');
}
export function makeObservationMetric(observations,updatedAt){
  if(!Array.isArray(observations)||!observations.length||observations.length>1000)fail('HEALTH_INVALID_OBSERVATION');
  for(const value of observations)validateObservation(value);
  const ordered=[...observations].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt)||a.sourceDevice.localeCompare(b.sourceDevice));
  const latest=ordered.at(-1),ties=ordered.filter(value=>value.observedAt===latest.observedAt);
  if(ties.some(value=>value.value!==latest.value))fail('HEALTH_AMBIGUOUS_OBSERVATION');
  return {...latest,updatedAt,aggregation:'latest-observation',observations:ordered};
}
export function validateHealthMetric(key,value){
  if(!own(HEALTH_METRICS,key) || !value || !Number.isFinite(value.value) || value.value<0 || value.unit!==HEALTH_METRICS[key] || typeof value.sourceDevice!=='string' || !value.sourceDevice || value.sourceDevice.length>256 || /[\r\n\0]/.test(value.sourceDevice)) fail('HEALTH_INVALID_RECORD');
  timestamp(value.updatedAt);
  if(key==='vo2_max'){
    const rebuilt=makeObservationMetric(value.observations,value.updatedAt);
    if(value.aggregation!=='latest-observation'||value.value!==rebuilt.value||value.unit!==rebuilt.unit||value.sourceDevice!==rebuilt.sourceDevice||value.observedAt!==rebuilt.observedAt||value.observedAtPrecision!==rebuilt.observedAtPrecision||value.sourceTimestamp!==rebuilt.sourceTimestamp)fail('HEALTH_INVALID_OBSERVATION');
  }
  if((key.endsWith('_total')||key.includes('_merged_')) && !/^Merged \(HealthKit daily statistics\)$/.test(value.sourceDevice)) fail('HEALTH_NON_MERGED_RECORD');
}
export function validateHealthDay(value,date){
  if(!value || value.schemaVersion!==1 || value.date!==date || value.provider!=='APPLE_HEALTH' || value.timezone!=='Europe/Berlin' || value.source!==HEALTH_SOURCE || !value.metrics || typeof value.metrics!=='object' || Array.isArray(value.metrics)) fail('HEALTH_INVALID_STORE');
  timestamp(value.fetchedAt);optionalTimestamp(value.sourceLastSyncAt);optionalTimestamp(value.sourceLastDataAt);
  for(const [key,metric] of Object.entries(value.metrics))validateHealthMetric(key,metric);
  return value;
}
export function validateHealthIndex(value){
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
