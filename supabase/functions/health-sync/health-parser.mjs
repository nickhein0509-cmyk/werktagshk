import {
  HEALTH_METRICS,
  HEALTH_SOURCE,
  fail,
  makeObservationMetric,
  newer,
  optionalTimestamp,
  timestamp,
  validHealthDate,
  validateHealthMetric,
} from '../_shared/health-contract.mjs';
export { HEALTH_METRICS, HEALTH_SOURCE, validHealthDate };

const own = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
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
    validateHealthMetric(key,metric);
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
