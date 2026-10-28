import { analyzeRoute } from '/assistenz/route.js';
import { renderHealth, resetHealth } from '/assistenz/health-v2.js';
import { createStatistics } from '/assistenz/statistics-v1.js';
import { createContext } from '/assistenz/context-v1.js';
const $=id=>document.getElementById(id),fmt=new Intl.NumberFormat('de-DE',{maximumFractionDigits:1});
const time=tst=>new Date(tst*1000).toLocaleTimeString('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit'});
const date=tst=>new Date(tst*1000).toLocaleDateString('de-DE',{timeZone:'Europe/Berlin'});
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const duration=seconds=>{const minutes=Math.floor(seconds/60);return minutes>=60?Math.floor(minutes/60)+' Std. '+minutes%60+' Min.':minutes+' Min.';};
const distance=m=>m<1000?Math.round(m)+' m':fmt.format(m/1000)+' km';
let map,layers,first=true,busy=false,active='today',lastView='',tilesFailed=false,generation=0,currentData,selected=null,pendingRefresh=false;
let view='day', contextReady=false;
const statistics=createStatistics({onDay:day=>changeDay(day),onLocked:()=>locked()});
const context=createContext({onLocked:()=>locked(),onChanged:()=>{statistics.invalidate(String(Date.now()));lastView='';}});
function showView(next){view=next;$('day-view').hidden=next!=='day';statistics.show(next==='statistics');$('view-day').classList.toggle('chosen',next==='day');$('view-day').setAttribute('aria-pressed',String(next==='day'));$('view-statistics').classList.toggle('chosen',next==='statistics');$('view-statistics').setAttribute('aria-pressed',String(next==='statistics'));$('day').closest('.date-control').hidden=next!=='day';if(next==='day')queueMicrotask(()=>map?.invalidateSize());}
function changeDay(value){generation++;active=value;selected=null;first=true;currentData=null;lastView='';showView('day');resetHealth('Health-Daten für diesen Tag werden geladen.');layers?.clearLayers();$('map-title').textContent='Tag wird geladen …';$('timeline').replaceChildren();context.setDay({date:active==='today'?today():active});refresh(true);}
$('view-day').addEventListener('click',()=>showView('day'));
$('view-statistics').addEventListener('click',()=>showView('statistics'));
const status=(text,kind='')=>{$('connection').textContent=text;$('connection').className='connection '+kind;};
function initMap(){
  if(!globalThis.L){$('map-message').textContent='Karte konnte nicht geladen werden. Bitte lade die Seite erneut.';return;}
  map=L.map('map',{zoomControl:true}).setView([51,10],5);layers=L.layerGroup().addTo(map);
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);
  tiles.on('tileerror',()=>{tilesFailed=true;$('map-message').hidden=false;$('map-message').textContent='Kartenhintergrund nicht erreichbar. Dein Weg bleibt eingezeichnet.';});
}
function fit(){if(!map)return;const bounds=L.latLngBounds(layers.getLayers().flatMap(layer=>layer.getLatLngs?layer.getLatLngs():layer.getLatLng?[layer.getLatLng()]:[]));if(bounds.isValid())map.fitBounds(bounds,{padding:[35,35],maxZoom:17});}
const ageText=seconds=>seconds<60?'vor '+Math.max(0,Math.floor(seconds))+' Sek.':seconds<3600?'vor '+Math.floor(seconds/60)+' Min.':'vor '+duration(seconds);
const intervalText=seconds=>seconds===null?'Noch zu wenige Messungen':seconds<60?Math.round(seconds)+' Sek.':fmt.format(seconds/60)+' Min.';
function renderFreshness(data){
  if(!$('recording-panel'))return;
  const checked=Date.parse(data.refreshedAt),now=Number.isFinite(checked)?checked:Date.now(),source=data.latestSourceTimestamp;
  const age=Number.isFinite(source)?(now-source*1000)/1000:null,ingestion=data.ingestion;
  $('recording-check').textContent=Number.isFinite(checked)?time(checked/1000)+' Uhr':'Nicht bekannt';
  $('recording-source').textContent=age===null?'Noch keine Messung':date(source)+' · '+time(source)+' Uhr · '+(age< -120?'Gerätezeit liegt voraus':ageText(age));
  const received=ingestion?.lastMessageAt;
  $('recording-receipt').textContent=received?time(Date.parse(received)/1000)+' Uhr · '+ageText(Math.max(0,(now-Date.parse(received))/1000)):'Seit Serverstart noch keine neue Nachricht beobachtet';
  $('recording-panel').classList.toggle('stale',age===null||age>900||age< -120);
  $('recording-title').textContent=age===null?'Noch kein GPS-Punkt gespeichert':age< -120?'Zeit am iPhone prüfen':age>900?'GPS-Punkt älter als 15 Minuten':'Letzter GPS-Punkt '+ageText(age);
  let message='Die Karte fragt alle 15 Sekunden nach. Neue GPS-Punkte entstehen unabhängig davon in OwnTracks.';
  if(age!==null&&age>900)message+=' Es ist bisher keine neuere Messung gespeichert; daraus folgt allein nicht, dass das iPhone offline ist.';
  if(ingestion?.lastLocationWasDuplicate===true)message+=' Die letzte Standortmeldung enthielt einen bereits gespeicherten Punkt.';
  else if(Number.isFinite(ingestion?.lastLocationFixTimestamp)&&ingestion.lastLocationFixTimestamp<source)message+=' Zuletzt kam eine ältere Messung aus der Warteschlange an.';
  $('recording-message').textContent=message;
  $('recording-observation').textContent=ingestion?.observedSince?'Nachrichteneingang beobachtet seit '+time(Date.parse(ingestion.observedSince)/1000)+' Uhr. Messung, Empfang und Kartenabruf sind getrennte Zeitpunkte.':'Messung und Kartenabruf sind getrennte Zeitpunkte. Noch keine getrennte Empfangsbeobachtung verfügbar.';
}
function renderAnalysis(model,journal,selection){
  if(!$('analysis-span'))return;
  $('analysis-span').textContent=duration(model.elapsedSeconds);
  $('analysis-stays').textContent=selection?.kind==='trip'?'–':duration((selection?[selection]:journal.stays).reduce((sum,s)=>sum+s.durationSeconds,0));
  $('analysis-gaps').textContent=model.gapSeconds?duration(model.gapSeconds):'Keine lange Lücke';
  $('analysis-interval').textContent=intervalText(model.medianIntervalSeconds);
  $('analysis-average').textContent=model.averageSpeedKmh===null?'Noch zu wenige Messungen':fmt.format(model.averageSpeedKmh)+' km/h · Ø zwischen plausiblen Messungen, einschließlich beobachteter Pausen';
}
function renderTimeline(data,models){
  const journal=data.journal,events=[...journal.trips,...journal.stays].sort((a,b)=>a.startTimestamp-b.startTimestamp||(a.kind==='trip'?-1:1));
  $('journal-summary').textContent=journal.trips.length+' Teilstrecken · '+journal.stays.length+' Aufenthalte';
  $('whole-day').textContent=active==='all'?'Alles zeigen':'Ganzen Tag zeigen';
  $('whole-day').classList.toggle('chosen',selected===null);
  $('timeline-empty').hidden=events.length>0;
  $('timeline-empty').textContent=data.points.length?'Noch keine Teilstrecke oder kein Aufenthalt mit genügend Messpunkten erkennbar.':'Für diesen Tag liegen keine GPS-Messungen vor.';
  $('timeline').replaceChildren(...events.map(entry=>{
    const button=document.createElement('button');button.type='button';button.className='event '+entry.kind+(selected===entry.id?' chosen':'');button.setAttribute('aria-pressed',String(selected===entry.id));
    const entries=entry.kind==='trip'?journal.trips:journal.stays,number=entries.findIndex(e=>e.id===entry.id)+1;
    const label=document.createElement('strong');label.textContent=(entry.kind==='trip'?'↗ Teilstrecke ':'◉ Aufenthalt ')+number;
    const timing=document.createElement('span');timing.textContent=(active==='all'?date(entry.startTimestamp)+' · ':'')+time(entry.startTimestamp)+' – '+time(entry.endTimestamp)+' Uhr';
    const detail=document.createElement('small'),analysis=models.get(entry.id);detail.textContent=entry.kind==='trip'?distance(analysis.distanceMetres)+' · '+duration(entry.durationSeconds)+(analysis.averageSpeedKmh===null?'':' · Ø '+fmt.format(analysis.averageSpeedKmh)+' km/h'):(entry.crossesMidnight?'Über Mitternacht · ':'Mind. ')+duration(entry.durationSeconds)+' · im Bereich von ca. 100 m';
    button.append(label,timing,detail);button.addEventListener('click',()=>{selected=entry.id;draw(currentData,true);});return button;
  }));
}
function renderArchive(data){
  const day=active==='today'?today():active,archive=data.archive,entry=archive?.days.find(e=>e.date===day);
  $('archive-status').textContent=archive?.status?.ok===false?'Archivierung braucht Aufmerksamkeit. Die GPS-Rohdaten bleiben gespeichert.':day==='all'?'Alle vorhandenen Aufzeichnungen bleiben gespeichert. Wähle einen Tag für den Tagesexport.':entry?'Tagesarchiv gespeichert · '+entry.pointCount+' Punkte · GPX und vollständige Tagesdatei':day===today()?'Heute wird fortlaufend gespeichert. Tagesarchiv automatisch nach Mitternacht.':data.totalSelected===0&&data.health?.status==='ok'?'Health-Tageswerte gespeichert. Für diesen Tag gibt es keine GPS-Aufzeichnung.':data.totalSelected===0?'Für diesen Tag ist keine GPS-Aufzeichnung gespeichert.':'Tagesarchiv wird beim nächsten automatischen Abgleich erstellt.';
  $('download-gpx').hidden=!entry;$('download-json').hidden=!entry;
  if(entry?.archiveSnapshotOlder)$('archive-status').textContent='Weitere Messungen sind nach dem Archiv eingetroffen. Tagesansicht und Statistik berücksichtigen sie; die Downloads erhalten den ursprünglichen Archivstand.';
  if(entry){$('download-gpx').href='/assistenz/archive?date='+day+'&format=gpx';$('download-json').href='/assistenz/archive?date='+day+'&format=json';}
}
function draw(data,force=false){
  currentData=data;
  const journal=data.journal,selection=[...journal.trips,...journal.stays].find(e=>e.id===selected);
  if(selected&&!selection)selected=null;
  const pts=selection?data.points.slice(selection.startIndex,selection.endIndex+1):data.points;
  const models=new Map(journal.trips.map(t=>[t.id,analyzeRoute(data.points.slice(t.startIndex,t.endIndex+1))]));
  const model=selection?.kind==='trip'?models.get(selection.id):analyzeRoute(pts,{journal:selection?{stays:[{startIndex:0,endIndex:pts.length-1}]}:journal});
  const distanceMetres=selection?.kind==='stay'?0:selection?model.distanceMetres:[...models.values()].reduce((total,t)=>total+t.distanceMetres,0);
  $('count').textContent=fmt.format(pts.length);$('total').textContent=(selection?data.totalSelected+' im Zeitraum · ':'')+fmt.format(data.totalStored)+' gesamt';
  $('distance').textContent=distance(distanceMetres);
  if($('distance-note'))$('distance-note').textContent='GPS-Näherung · ohne erkannte Aufenthalte';
  $('latest').textContent=pts.length?time(pts.at(-1).tst)+' Uhr':'–';
  const received=pts.reduce((value,p)=>!value||p.receivedAt>value?p.receivedAt:value,null);
  $('received').textContent=received?'Empfangen '+time(Date.parse(received)/1000)+' Uhr':'Noch keine Punkte';
  const knownDays=[...new Set([...(active!=='today'&&active!=='all'?[active]:[]),...data.days,...(data.archive?.days.map(e=>e.date)??[]),...(data.health?.days??[])])].filter(d=>d!==today()).sort().reverse();
  const options=[['today','Heute'],...knownDays.map(d=>[d,new Date(d+'T12:00:00Z').toLocaleDateString('de-DE',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Berlin'})+(data.archive?.days.some(e=>e.date===d)?' · archiviert':'')]),['all','Alle Aufzeichnungen']];
  $('day').replaceChildren(...options.map(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;return option;}));$('day').value=active;$('day').disabled=false;
  $('map-title').textContent=selection?(selection.kind==='trip'?'Deine Teilstrecke':'Dein Aufenthalt'):active==='today'?'Dein Weg heute':active==='all'?'Alle Aufzeichnungen':'Dein Weg · '+new Date(active+'T12:00:00Z').toLocaleDateString('de-DE');
  $('range').textContent=pts.length?date(pts[0].tst)+' · '+time(pts[0].tst)+' bis '+date(pts.at(-1).tst)+' · '+time(pts.at(-1).tst)+' Uhr':'Für diesen Zeitraum sind noch keine Standortpunkte vorhanden.';
  $('quality').textContent='Bereinigte GPS-Näherung, keine berechnete Straßenstrecke. '+model.poorFixCount+' ungenaue Punkte · '+model.outlierCount+' isolierte Sprünge · '+model.suppressedJitterCount+' kleine GPS-Bewegungen geglättet. '+model.gapCount+' Lücken oder unplausible Übergänge werden nicht verbunden.'+(model.unknownAccuracyCount?' Bei '+model.unknownAccuracyCount+' Punkten fehlt die Genauigkeitsangabe.':'')+' Aufenthalte sind eine Näherung ab 10 Minuten im Bereich von ca. 100 m, nur bis zur letzten passenden Messung.'+(data.truncated?' Anzeige auf die neuesten 20.000 Punkte gekürzt. Bitte wähle einen einzelnen Tag.':'');
  renderTimeline(data,models);renderAnalysis(model,journal,selection);renderArchive(data);renderHealth(data.health,{selectedPart:Boolean(selection)});
  const chosenDay=active==='today'?today():active,archiveRevision=data.archive?.days.find(e=>e.date===chosenDay)?.revision;
  context.setDay({date:chosenDay,segment:selection,journal:data.journal,archiveRevision});
  const latestFix=pts.at(-1),sensor=[];
  if(Number.isFinite(latestFix?.batt))sensor.push('Akku '+fmt.format(latestFix.batt)+' %');
  if(Number.isFinite(latestFix?.alt))sensor.push('Höhe '+fmt.format(latestFix.alt)+' m ü. M.');
  if(Number.isFinite(latestFix?.vel))sensor.push('Geschwindigkeit '+fmt.format(latestFix.vel)+' km/h');
  $('sensor-details').textContent=sensor.length?'Letzter gewählter Messpunkt · '+time(latestFix.tst)+' Uhr: '+sensor.join(' · '):'Keine zusätzlichen GPS-Sensorwerte am letzten gewählten Messpunkt.';
  if(!map)return;layers.clearLayers();
  const drawPart=part=>{if(part.length>1)L.polyline(part.map(p=>[p.lat,p.lon]),{color:'#20674f',weight:5,opacity:.88,lineJoin:'round'}).addTo(layers);};
  if(selection?.kind==='stay'){
    L.circle([selection.center.lat,selection.center.lon],{radius:journal.settings.radiusMetres,color:'#a9782e',weight:2,fillColor:'#dfbc6f',fillOpacity:.18}).addTo(layers);
    L.circleMarker([selection.center.lat,selection.center.lon],{radius:9,color:'#fff',weight:3,fillColor:'#a9782e',fillOpacity:1}).bindPopup('Aufenthalt · '+time(selection.startTimestamp)+'–'+time(selection.endTimestamp)+' Uhr').addTo(layers);
  }else{
    if(selection)model.segments.forEach(drawPart);
    else{
      journal.trips.forEach(t=>models.get(t.id).segments.forEach(drawPart));
      journal.stays.forEach(s=>L.circleMarker([s.center.lat,s.center.lon],{radius:6,color:'#fff',weight:2,fillColor:'#a9782e',fillOpacity:1}).bindPopup('Aufenthalt · '+time(s.startTimestamp)+'–'+time(s.endTimestamp)+' Uhr').addTo(layers));
    }
    const shown=model.segments.flat();
    if(shown.length){for(const[p,label,color,radius]of [[shown[0],'Start','#a3be59',7],[shown.at(-1),'Letzter Punkt','#183d36',9]]){const content=document.createElement('span');content.textContent=label+' · '+date(p.tst)+' · '+time(p.tst)+' Uhr'+(p.acc!==undefined?' · Genauigkeit ±'+Math.round(p.acc)+' m':'');L.circleMarker([p.lat,p.lon],{radius,color:'#fff',weight:3,fillColor:color,fillOpacity:1}).bindPopup(content).addTo(layers);}}
  }
  if(!tilesFailed){$('map-message').hidden=layers.getLayers().length>0;$('map-message').textContent=pts.length?'Die vorhandenen Punkte sind für eine Route zu ungenau.':'Noch keine Punkte in diesem Zeitraum.';}
  if(force||first){fit();first=false;}
}
function locked(){
  statistics.reset();context.reset();contextReady=false;$('view-day').disabled=true;$('view-statistics').disabled=true;$('sensor-details').textContent='';showView('day');
  resetHealth('Melde dich über Mein Konto an oder öffne deinen privaten Kartenlink für deine Health-Werte.');
  status('Geschützter Zugriff');$('access').hidden=false;$('day').disabled=true;layers?.clearLayers();currentData=null;selected=null;$('timeline').replaceChildren();$('journal-summary').textContent='Zugriff erforderlich';$('archive-status').textContent='Melde dich über Mein Konto an oder öffne deinen privaten Kartenlink.';$('download-gpx').hidden=true;$('download-json').hidden=true;
  for(const id of ['distance','count','latest','received','range'])$(id).textContent='–';$('total').textContent='Zugriff erforderlich';$('map-message').hidden=false;$('map-message').textContent='Melde dich über Mein Konto an oder öffne deinen privaten Kartenlink.';
  for(const id of ['recording-check','recording-source','recording-receipt','analysis-span','analysis-stays','analysis-gaps','analysis-interval','analysis-average'])if($(id))$(id).textContent='–';
  if($('recording-title')){$('recording-title').textContent='Privater Empfangsstatus';$('recording-message').textContent='Melde dich über Mein Konto an oder öffne deinen privaten Kartenlink.';$('recording-observation').textContent='';}
}
async function refresh(force=false){
  if(document.hidden)return;if(busy){if(force)pendingRefresh=true;return;}busy=true;const revision=generation;
  try{
    const d=active==='today'?today():active,r=await fetch('/assistenz/data?date='+encodeURIComponent(d),{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(revision!==generation)return;if(r.status===401){locked();return;}if(!r.ok)throw new Error();
    const data=await r.json();if(revision!==generation)return;$('access').hidden=true;$('view-day').disabled=false;$('view-statistics').disabled=false;renderFreshness(data);currentData=data;if(!contextReady){contextReady=true;await context.unlock();if(revision!==generation)return;}status('Server erreichbar · Karte alle 15 Sek.','ok');
    const key=JSON.stringify([d,data.totalStored,data.totalSelected,data.latestReceivedAt,data.archive,data.health]);
    if(force||lastView!==key){draw(data,force);lastView=key;statistics.invalidate(key);}statistics.refresh();context.refresh();
  }catch{if(revision===generation)status(navigator.onLine?'Verbindung unterbrochen · Wiederholung folgt':'Offline · Wiederholung folgt','error');}finally{busy=false;if(pendingRefresh){pendingRefresh=false;queueMicrotask(()=>refresh(true));}}
}
document.addEventListener('werktag:assistance-lock',()=>locked());
async function unlock(key){const r=await fetch('/assistenz/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key}),signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error(r.status===429?'Bitte warte eine Minute und versuche es erneut.':'Der Kartenlink ist ungültig.');$('access').hidden=true;lastView='';await refresh(true);}
$('day').addEventListener('change',()=>changeDay($('day').value));
$('whole-day').addEventListener('click',()=>{selected=null;if(currentData)draw(currentData,true);});
$('fit').addEventListener('click',fit);
$('refresh-now')?.addEventListener('click',()=>refresh(true));
$('login').addEventListener('submit',async event=>{event.preventDefault();let key=$('key').value.trim();try{if(key.includes('#'))key=new URLSearchParams(new URL(key).hash.slice(1)).get('key')??'';$('key').value='';await unlock(key);$('login-error').textContent='';}catch(e){$('login-error').textContent=e.message;}});
$('logout').addEventListener('click',async()=>{generation++;try{const r=await fetch('/assistenz/logout',{method:'POST',signal:AbortSignal.timeout(8000)});if(r.ok){locked();if(map)map.setView([51,10],5);lastView='';}else throw new Error();}catch{status('Sperren fehlgeschlagen · bitte erneut versuchen','error');}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});window.addEventListener('online',()=>refresh());
const fragment=new URLSearchParams(location.hash.slice(1));let key=fragment.get('key'),ownerKey=fragment.get('owner');if(location.hash)history.replaceState(null,'','/assistenz');fragment.delete('key');fragment.delete('owner');
initMap();
try{if(key)await unlock(key);else await refresh(true);key=null;if(ownerKey&&contextReady){try{await context.enableOwner(ownerKey);}catch(e){$('context-message').textContent=e.message;}}}catch(e){locked();$('login-error').textContent=e.message;}finally{key=null;ownerKey=null;}
setInterval(()=>refresh(),15000);
