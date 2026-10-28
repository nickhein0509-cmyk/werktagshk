const $=id=>document.getElementById(id);
const fmt=new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}),integer=new Intl.NumberFormat('de-DE',{maximumFractionDigits:0});
const stamp=iso=>iso?new Date(iso).toLocaleString('de-DE',{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+' Uhr':'unbekannt';
export function resetHealth(message='Health-Daten werden geladen.'){
  for(const id of ['health-steps','health-energy','health-exercise','health-sleep','health-heart','health-rest','health-hrv','health-distance'])$(id).textContent='–';$('health-extras').textContent='';
  $('health-grid').hidden=true;$('health-message').hidden=false;$('health-message').textContent=message;$('health-source').textContent='Apple Health über Freddy';$('health-sync').textContent='';$('health-scope').textContent='';
}
export function renderHealth(health,{selectedPart=false}={}){
  if(!health){resetHealth('Noch keine Health-Daten importiert.');return;}
  $('health-source').textContent='Apple Health über Freddy';
  $('health-sync').textContent='Quellen-Sync: '+stamp(health.sourceLastSyncAt)+' · Kartenabgleich: '+stamp(health.fetchedAt);
  $('health-scope').textContent=(selectedPart?'Diese Health-Werte gelten für den gesamten gewählten Tag, nicht nur für diesen Streckenabschnitt. ':'')+'Tageswerte können unvollständig sein und später ergänzt werden. Health-Strecke und GPS-Strecke sind unterschiedliche Messwerte.';
  if(health.date==='all'){resetHealth('Wähle oben einen einzelnen Tag für deine Health-Werte.');$('health-sync').textContent='Letzter Kartenabgleich: '+stamp(health.fetchedAt);return;}
  if(health.status==='error'){resetHealth('Health-Daten vorübergehend nicht lesbar. Deine GPS-Karte bleibt verfügbar.');return;}
  const metrics=health.metrics??{},values=Object.values(metrics).filter(m=>Number.isFinite(m?.value));
  if(!values.length){resetHealth('Für diesen Tag sind noch keine Health-Werte gespeichert. Fehlende Messungen werden nicht als null gewertet.');$('health-sync').textContent='Letzter Quellen-Sync: '+stamp(health.sourceLastSyncAt);return;}
  $('health-message').hidden=true;$('health-grid').hidden=false;
  const value=(key,format=integer)=>Number.isFinite(metrics[key]?.value)?format.format(metrics[key].value):'–';
  const set=(id,key,format)=>{$(id).textContent=value(key,format);};
  set('health-steps','steps_total');set('health-energy','active_energy_total');set('health-exercise','exercise_time_total');
  set('health-heart','heart_rate_merged_avg',fmt);set('health-rest','resting_heart_rate_merged_avg',fmt);set('health-hrv','hrv_sdnn_merged_avg',fmt);
  const metres=metrics.distance_walk_run_total?.value;$('health-distance').textContent=Number.isFinite(metres)?fmt.format(metres/1000):'–';
  const sleep=['sleep_analysis_core_seconds','sleep_analysis_deep_seconds','sleep_analysis_rem_seconds'].map(key=>metrics[key]?.value);
  if(sleep.every(Number.isFinite)){const minutes=Math.floor(sleep.reduce((sum,v)=>sum+v,0)/60);$('health-sleep').textContent=Math.floor(minutes/60)+' h '+String(minutes%60).padStart(2,'0');$('health-sleep-note').textContent='Core + Tief + REM · Quelltag';}
  else{$('health-sleep').textContent='–';$('health-sleep-note').textContent='Keine vollständigen Schlafphasen';}
  const extras=[];
  if(Number.isFinite(metrics.flights_climbed_total?.value))extras.push(integer.format(metrics.flights_climbed_total.value)+' Etagen');
  if(Number.isFinite(metrics.stand_time_total?.value))extras.push(integer.format(metrics.stand_time_total.value)+' Min. Stehzeit');
  if(Number.isFinite(metrics.basal_energy_total?.value))extras.push(integer.format(metrics.basal_energy_total.value)+' kcal Ruheenergie');
  if(Number.isFinite(metrics.time_in_daylight_total?.value))extras.push(fmt.format(metrics.time_in_daylight_total.value)+' Min. Tageslicht');
  if(Number.isFinite(metrics.respiratory_rate_merged_avg?.value))extras.push(fmt.format(metrics.respiratory_rate_merged_avg.value)+' Atemzüge/Min. · Tagesmittel');
  const vo2=metrics.vo2_max;
  if(Number.isFinite(vo2?.value)&&vo2.aggregation==='latest-observation'&&vo2.observedAt)extras.push('VO₂max '+fmt.format(vo2.value)+' ml/kg/min · letzte Beobachtung '+stamp(vo2.observedAt)+(vo2.observedAtPrecision==='minute'?' (Minutenpräzision)':'')+' · '+vo2.sourceDevice);
  $('health-extras').textContent=extras.join(' · ');
}
