import { analyzeRoute } from '/assistenz/route.js';
import { renderHealth, resetHealth } from '/assistenz/health-v2.js';
import { createStatistics } from '/assistenz/statistics-v1.js';
import { createContext } from '/assistenz/context-v1.js';
import { createWorkspace } from '/assistance-assets/workspace.js';
import { renderJourneyMap, recorderKey, recorderLabel, recorderQuery } from '/assistance-assets/map-presentation.js';
const $=id=>document.getElementById(id),fmt=new Intl.NumberFormat('de-DE',{maximumFractionDigits:1});
const time=tst=>new Date(tst*1000).toLocaleTimeString('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit'});
const date=tst=>new Date(tst*1000).toLocaleDateString('de-DE',{timeZone:'Europe/Berlin'});
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const duration=seconds=>{const minutes=Math.floor(seconds/60);return minutes>=60?Math.floor(minutes/60)+' Std. '+minutes%60+' Min.':minutes+' Min.';};
const distance=m=>m<1000?Math.round(m)+' m':fmt.format(m/1000)+' km';
let map,layers,basemap,mapLibraryPromise=null,first=true,busy=false,active='today',lastView='',generation=0,currentData,selected=null,pendingRefresh=false;
let basemapRevision=0,basemapTimer,provider='openfreemap';
let view='overview', contextReady=false, accessReady=false;
let mapBounds=null,requestedRecorder=null,recorderChoices=[],dataController;
const statistics=createStatistics({onDay:(day,recorder)=>{requestedRecorder=recorderKey(recorder)?recorder:null;changeDay(day);},onLocked:()=>locked()});
const context=createContext({onLocked:()=>locked(),onAccessChanged:()=>refresh(true),onChanged:()=>{statistics.invalidate(String(Date.now()));lastView='';workspace.invalidate();workspace.refresh();}});
const workspace=createWorkspace({onLocked:()=>locked(),onChanged:()=>{statistics.invalidate(String(Date.now()));lastView='';context.refresh();},onDay:day=>changeDay(day),onOwner:()=>{showView('day');$('context-owner-details').open=true;$('context-owner-token').focus();$('context-owner').scrollIntoView({block:'nearest'});}});
function showView(next){
  view=next;document.body.classList.toggle('is-day-view',next==='day');$('day-view').hidden=next!=='day';statistics.show(next==='statistics');workspace.show(next);
  for(const name of ['overview','workspace','day','statistics']){const button=$('view-'+name);button.classList.toggle('chosen',next===name);button.setAttribute('aria-pressed',String(next===name));}
  $('day').closest('.date-control').hidden=next!=='day';
  // The provider sees viewport requests only after opening Mein Tag. Measured
  // routes, personal notes and Health records remain local to this private app.
  if(next==='day'&&accessReady){
    if(!map)initMap();if(currentData)draw(currentData,true);
    queueMicrotask(()=>{if(view==='day'&&accessReady){map?.invalidateSize();if(currentData)fit();}});
  }
}
function changeDay(value){
  dataController?.abort();
  generation++;active=value;updateDayNavigation();selected=null;first=true;currentData=null;lastView='';mapBounds=null;showView('day');resetHealth('Health-Daten für diesen Tag werden geladen.');layers?.clearLayers();$('map-title').textContent='Tag wird geladen …';$('map-selection-summary').textContent='Deine gespeicherten Messungen werden abgerufen.';$('map-message').hidden=false;$('map-message').textContent='Tag wird geladen …';$('timeline').replaceChildren();$('journal-summary').textContent='Tag wird geladen …';$('timeline-empty').hidden=true;$('recorder').disabled=true;$('map-mode').textContent='Wird geladen';
  $('calendar-day').value=active==='today'?today():active==='all'?'':active;
  context.setDay({date:active==='today'?today():active});workspace.setDay(active==='today'?today():active);refresh(true);
}
function renderRecorders(data){
  const control=$('recorder'),hasMetadata=Array.isArray(data.recorders);
  recorderChoices=hasMetadata?data.recorders.filter(recorder=>recorderKey(recorder)):[];
  const resolved=recorderKey(data.selectedRecorder)?data.selectedRecorder:null;
  // Legacy servers and isolated fixtures do not expose recorder metadata.
  // Their measurements remain usable without inventing a source label.
  const available=hasMetadata&&Boolean(recorderChoices.length||resolved||requestedRecorder);
  $('recorder-control').hidden=!available;
  statistics.setRecorder(resolved);
  if(!available)return;
  const automatic=document.createElement('option');automatic.value='';automatic.textContent='Automatisch'+(resolved?' · '+recorderLabel(resolved):' · keine Aufzeichnung');
  const options=recorderChoices.map(recorder=>{const option=document.createElement('option');option.value=recorderKey(recorder);option.textContent=recorderLabel(recorder)+' · '+fmt.format(recorder.pointCount)+' Punkte';return option;});
  if(requestedRecorder&&!options.some(option=>option.value===recorderKey(requestedRecorder))){const option=document.createElement('option');option.value=recorderKey(requestedRecorder);option.textContent=recorderLabel(requestedRecorder)+' · keine Punkte im Zeitraum';options.push(option);}
  control.replaceChildren(automatic,...options);control.value=recorderKey(requestedRecorder);control.disabled=!accessReady;
  $('recorder-note').textContent=resolved?'Angezeigt: '+recorderLabel(resolved)+'. Wege verschiedener Geräte bleiben getrennt.':'Für diesen Zeitraum liegen keine Messungen der gewählten Aufzeichnung vor.';
}
$('recorder').addEventListener('change',()=>{
  requestedRecorder=recorderChoices.find(recorder=>recorderKey(recorder)===$('recorder').value)??null;
  statistics.setRecorder(requestedRecorder);changeDay(active);
});
for(const name of ['overview','workspace','day','statistics'])$('view-'+name).addEventListener('click',()=>showView(name));
$('calendar-day').addEventListener('change',()=>{if($('calendar-day').value)changeDay($('calendar-day').value);});
const status=(text,kind='')=>{$('connection').textContent=text;$('connection').className='connection '+kind;};
function mapFailure(message){
  $('map-message').hidden=false;$('map-message').textContent=message;$('map-retry').hidden=false;
}
function basemapState(state,revision=basemapRevision){
  if(revision!==basemapRevision||!accessReady)return;
  const label=$('basemap-status');label.dataset.state=state;label.dataset.provider=provider;
  const messages=provider==='openfreemap'?{
    loading:'Straßenkarte wird geladen …',ready:'Straßenkarte bereit · OpenFreeMap',
    error:'Straßenkarte nicht erreichbar oder auf diesem Gerät nicht darstellbar. Erneut laden oder die Alternative wählen.'
  }:{
    loading:'Alternative wird geladen …',ready:'OpenStreetMap-Kacheln empfangen. Bei einem Sperrhinweis zur Straßenkarte wechseln.',
    error:'Kartenhintergrund teilweise nicht erreichbar. Zur Straßenkarte wechseln oder erneut laden.'
  };
  label.textContent=messages[state]??'Karte noch nicht geöffnet.';$('map-retry').hidden=state!=='error';
}
function disposeBasemap(){
  basemapRevision++;clearTimeout(basemapTimer);
  try{basemap?.remove();}catch{}basemap=null;
}
async function loadBasemap(){
  if(!map||!accessReady||view!=='day')return;
  disposeBasemap();const revision=basemapRevision,host=map;
  basemapState('loading',revision);
  basemapTimer=setTimeout(()=>basemapState('error',revision),20000);
  if(provider==='osm'){
    // Only the public origin is sent, never the private path, query or fragment.
    // Keep the document's no-referrer policy for every other external request.
    const layer=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,referrerPolicy:'origin',
      attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
    });
    const failed=new Set();let loaded=0;
    const settled=()=>{
      if(revision!==basemapRevision)return;
      clearTimeout(basemapTimer);
      basemapState(failed.size||!loaded?'error':'ready',revision);
    };
    layer.on('tileerror',event=>{if(revision!==basemapRevision)return;failed.add(event.tile);clearTimeout(basemapTimer);basemapState('error',revision);});
    layer.on('tileload',event=>{failed.delete(event.tile);loaded++;});
    layer.on('tileunload',event=>{failed.delete(event.tile);if(!layer.isLoading())settled();});
    layer.on('loading',()=>{if(revision!==basemapRevision)return;basemapState('loading',revision);clearTimeout(basemapTimer);basemapTimer=setTimeout(()=>basemapState('error',revision),20000);});
    layer.on('load',settled);basemap=layer;layer.addTo(host);return;
  }
  try{
    if(!window.werktagLoadBasemap)throw new Error('renderer-not-ready');
    const engine=await window.werktagLoadBasemap();
    if(revision!==basemapRevision||!accessReady||map!==host)return;
    basemap=engine.createVectorLayer({L,onState:state=>{
      if(revision!==basemapRevision)return;
      if(state!=='loading')clearTimeout(basemapTimer);
      basemapState(state,revision);
    }});
    basemap.addTo(host);
  }catch{if(revision===basemapRevision){clearTimeout(basemapTimer);basemapState('error',revision);}}
}
function initMap(){
  if(view!=='day'||!accessReady)return false;
  if(!globalThis.L){mapFailure('Die Kartenbibliothek ist gerade nicht verfügbar. Deine Zeitachse und Einträge bleiben nutzbar.');return false;}
  try{
    map=L.map('map',{zoomControl:true,zoomAnimation:false,minZoom:1,maxZoom:19,maxBounds:[[-85.051129,-Infinity],[85.051129,Infinity]],maxBoundsViscosity:1});map.setView([51,10],5);layers=L.layerGroup().addTo(map);
    $('map-provider').disabled=false;void loadBasemap();return true;
  }catch{
    disposeBasemap();try{map?.remove();}catch{}map=null;layers=null;
    // A constructor may fail after Leaflet stamps the container but before it
    // returns a map handle. Replace only this owned empty map host for retry.
    const container=$('map');container.replaceWith(container.cloneNode(false));
    mapFailure('Die Karte konnte nicht starten. Lade sie erneut; deine Einträge bleiben erhalten.');return false;
  }
}
async function retryMap(){
  if(!accessReady||view!=='day')return;
  const revision=generation;$('map-retry').disabled=true;
  try{
    if(!globalThis.L){
      if(!mapLibraryPromise)mapLibraryPromise=new Promise((resolve,reject)=>{
        const script=document.createElement('script');script.src='/assistance-assets/vendor/leaflet.js';script.async=true;
        const timer=setTimeout(()=>{script.remove();reject(new Error('map-timeout'));},10000);
        script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('map-library'));};document.head.append(script);
      }).finally(()=>{mapLibraryPromise=null;});
      await mapLibraryPromise;
    }
    if(revision!==generation||!accessReady||view!=='day')return;
    if(map){await loadBasemap();map.invalidateSize();}
    else if(initMap()&&currentData){draw(currentData,true);map.invalidateSize();}
  }catch{if(revision===generation)mapFailure('Kartenbibliothek weiterhin nicht erreichbar. Die Zeitachse funktioniert ohne Kartenhintergrund.');}
  finally{$('map-retry').disabled=false;}
}
function fit(){
  if(map&&mapBounds?.isValid())map.fitBounds(mapBounds,{paddingTopLeft:[48,42],paddingBottomRight:[48,44],maxZoom:17,animate:false});
}
function updateDayNavigation(){
  const chosen=active==='today'?today():active;
  $('timeline-date-label').textContent=chosen==='all'?'Alle Aufzeichnungen':(chosen===today()?'Heute · ':'')+new Date(chosen+'T12:00:00Z').toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Berlin'});
  $('day-previous').disabled=!accessReady||chosen==='2000-01-01';$('day-next').disabled=!accessReady||chosen==='2100-12-31';$('day-today').disabled=!accessReady||active==='today';
}
function stepDay(delta){
  const base=active==='all'||active==='today'?today():active,value=new Date(base+'T12:00:00Z');value.setUTCDate(value.getUTCDate()+delta);
  const chosen=value.toISOString().slice(0,10);if(chosen>='2000-01-01'&&chosen<='2100-12-31')changeDay(chosen===today()?'today':chosen);
}
$('day-previous').addEventListener('click',()=>stepDay(-1));$('day-next').addEventListener('click',()=>stepDay(1));$('day-today').addEventListener('click',()=>changeDay('today'));
$('map-retry').addEventListener('click',retryMap);
$('map-provider').addEventListener('change',()=>{
  provider=$('map-provider').value==='osm'?'osm':'openfreemap';void loadBasemap();
});
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
function selectSegment(id,{focus=false}={}){
  selected=id;if(currentData)draw(currentData,true);
  if(focus){const button=[...$('timeline').querySelectorAll('.event')].find(node=>node.dataset.segmentId===id);button?.focus({preventScroll:true});}
}
function renderTimeline(data,models){
  const focusedId=$('timeline').contains(document.activeElement)?document.activeElement.dataset.segmentId:null;
  const journal=data.journal,events=[...journal.trips,...journal.stays].sort((a,b)=>a.startTimestamp-b.startTimestamp||(a.kind==='trip'?-1:1));
  $('journal-summary').textContent=journal.trips.length+' Teilstrecken · '+journal.stays.length+' Aufenthalte';
  $('timeline-day-summary').textContent=data.points.length?data.totalSelected+' gespeicherte Messpunkte · '+journal.trips.length+' Wege · '+journal.stays.length+' Aufenthalte':'Keine GPS-Messungen an diesem Tag. Eigene Einträge kannst du trotzdem festhalten.';
  $('whole-day').textContent=active==='all'?'Alles zeigen':'Ganzen Tag zeigen';$('whole-day').classList.toggle('chosen',selected===null);
  $('timeline-empty').hidden=events.length>0;
  $('timeline-empty').textContent=data.points.length?'Noch keine Teilstrecke oder kein Aufenthalt mit genügend Messpunkten erkennbar.':'Für diesen Tag liegen keine GPS-Messungen vor. Wähle einen anderen Tag oder ergänze unten deinen Tageskontext.';
  const gaps=[];
  for(let i=1;i<data.points.length;i++){
    const start=data.points[i-1].tst,end=data.points[i].tst;
    if(Number.isFinite(start)&&Number.isFinite(end)&&end-start>(journal.settings?.maxGapSeconds??900))gaps.push({kind:'gap',startTimestamp:start,endTimestamp:end,durationSeconds:end-start});
  }
  const rows=[...events,...gaps].sort((a,b)=>a.startTimestamp-b.startTimestamp||(a.kind==='gap'?1:-1));
  const nodes=rows.map(entry=>{
    if(entry.kind==='gap'){
      const row=document.createElement('div');row.className='timeline-gap';
      const label=document.createElement('strong');label.textContent='Aufzeichnungslücke';
      const detail=document.createElement('span');detail.textContent=(active==='all'?date(entry.startTimestamp)+' · ':'')+time(entry.startTimestamp)+' – '+time(entry.endTimestamp)+' · '+duration(entry.durationSeconds);
      const note=document.createElement('small');note.textContent='Keine durchgehenden Messungen. Dieser Abschnitt wird nicht als Weg ergänzt.';row.append(label,detail,note);return row;
    }
    const button=document.createElement('button');button.type='button';button.className='event '+entry.kind+(selected===entry.id?' chosen':'');button.dataset.segmentId=entry.id;button.setAttribute('aria-pressed',String(selected===entry.id));
    const entries=entry.kind==='trip'?journal.trips:journal.stays,number=entries.findIndex(e=>e.id===entry.id)+1;
    const label=document.createElement('strong');label.textContent=(entry.kind==='trip'?'Teilstrecke ':'Aufenthalt ')+number;button.dataset.number=String(number);
    const timing=document.createElement('span');timing.textContent=(active==='all'?date(entry.startTimestamp)+' · ':'')+time(entry.startTimestamp)+' – '+time(entry.endTimestamp)+' Uhr';
    const detail=document.createElement('small'),analysis=models.get(entry.id);detail.textContent=entry.kind==='trip'?distance(analysis.distanceMetres)+' · '+duration(entry.durationSeconds)+(analysis.averageSpeedKmh===null?'':' · Ø '+fmt.format(analysis.averageSpeedKmh)+' km/h'):(entry.crossesMidnight?'Über Mitternacht · ':'Mind. ')+duration(entry.durationSeconds)+' · im Bereich von ca. 100 m';
    const hint=document.createElement('small');hint.className='event-hint';hint.textContent=selected===entry.id?'Auf der Karte ausgewählt':'Auf der Karte ansehen';
    button.append(label,timing,detail,hint);button.addEventListener('click',()=>selectSegment(entry.id,{focus:true}));return button;
  });
  $('timeline').replaceChildren(...nodes);
  if(focusedId)(nodes.find(node=>node.dataset.segmentId===focusedId)??$('whole-day')).focus({preventScroll:true});
}
function renderArchive(data){
  const day=active==='today'?today():active,archive=data.archive,entry=archive?.days.find(e=>e.date===day);
  $('archive-status').textContent=archive?.status?.ok===false?'Archivierung braucht Aufmerksamkeit. Die GPS-Rohdaten bleiben gespeichert.':day==='all'?'Alle vorhandenen Aufzeichnungen bleiben gespeichert. Wähle einen Tag für den Tagesexport.':entry?'Tagesarchiv v'+(entry.schemaVersion??1)+' gespeichert · '+entry.pointCount+' Punkte · GPX und vollständige Tagesdatei':day===today()?'Heute wird fortlaufend gespeichert. Tagesarchiv automatisch nach Mitternacht.':data.totalSelected===0&&data.health?.status==='ok'?'Health-Tageswerte gespeichert. Für diesen Tag gibt es keine GPS-Aufzeichnung.':data.totalSelected===0?'Für diesen Tag ist keine GPS-Aufzeichnung gespeichert.':'Tagesarchiv wird beim nächsten automatischen Abgleich erstellt.';
  $('download-gpx').hidden=!entry;$('download-json').hidden=!entry;
  if(archive?.status?.deferredDates?.includes(day)&&!entry)$('archive-status').textContent='Mindestens eine ältere Aufzeichnung dieses Tages hat keine eindeutige Recorderkennung. Die Rohdaten bleiben erhalten; ein v2-Archiv wird noch nicht erzeugt.';
  if(entry?.multipleRecorders)$('archive-status').textContent=entry.schemaVersion===2?'Tagesarchiv v2 gespeichert · '+entry.recorderCount+' Geräte sind getrennt archiviert; die Ansicht zeigt nur das gewählte Gerät.':'Mehrere Geräte zeichnen diesen Tag auf. Downloads enthalten den ursprünglichen v1-Archivstand und entsprechen nicht zwingend der gewählten Geräteansicht.';
  if(entry?.archiveSnapshotOlder)$('archive-status').textContent='Weitere Messungen sind nach dem Archiv eingetroffen. Tagesansicht und Statistik berücksichtigen sie; die Downloads erhalten den ursprünglichen Archivstand.';
  if(entry){$('download-gpx').href='/assistenz/archive?date='+day+'&format=gpx';$('download-json').href='/assistenz/archive?date='+day+'&format=json';}
}
function draw(data,force=false){
  currentData=data;
  renderRecorders(data);
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
  const received=pts.reduce((value,p)=>!value||Date.parse(p.receivedAt)>Date.parse(value)||(Date.parse(p.receivedAt)===Date.parse(value)&&p.receivedAt>value)?p.receivedAt:value,null);
  $('received').textContent=received?'Empfangen '+time(Date.parse(received)/1000)+' Uhr':'Noch keine Punkte';
  const knownDays=[...new Set([...(active!=='today'&&active!=='all'?[active]:[]),...data.days,...(data.archive?.days.map(e=>e.date)??[]),...(data.health?.days??[])])].filter(d=>d!==today()).sort().reverse();
  const options=[['today','Heute'],...knownDays.map(d=>[d,new Date(d+'T12:00:00Z').toLocaleDateString('de-DE',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Berlin'})+(data.archive?.days.some(e=>e.date===d)?' · archiviert':'')]),['all','Alle Aufzeichnungen']];
  $('day').replaceChildren(...options.map(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;return option;}));$('day').value=active;updateDayNavigation();$('day').disabled=false;$('calendar-day').disabled=false;$('calendar-day').value=active==='today'?today():active==='all'?'':active;
  $('map-selection-summary').textContent=selection?(selection.kind==='trip'?'Ausgewählte Teilstrecke':'Ausgewählter Aufenthalt')+' · '+time(selection.startTimestamp)+'–'+time(selection.endTimestamp)+' Uhr · '+duration(selection.durationSeconds)+(selection.kind==='trip'?' · '+distance(distanceMetres):''):'Gemessene Wege und nummerierte Aufenthalte. Wähle einen Abschnitt für die Details.';
  $('map-mode').textContent=selection?(selection.kind==='trip'?'Teilstrecke ':'Aufenthalt ')+(journal[selection.kind==='trip'?'trips':'stays'].findIndex(entry=>entry.id===selection.id)+1):'Tagesübersicht';
  $('fit').textContent=selection?'Auswahl einpassen ↗':'Wege einpassen ↗';
  $('map-route-note').textContent='GPS-Näherung'+(model.gapCount?' · '+model.gapCount+' unterbrochene Übergänge':'')+' · Aufzeichnungslücken bleiben offen.';
  $('map-title').textContent=selection?(selection.kind==='trip'?'Deine Teilstrecke':'Dein Aufenthalt'):active==='today'?'Dein Weg heute':active==='all'?'Alle Aufzeichnungen':'Dein Weg · '+new Date(active+'T12:00:00Z').toLocaleDateString('de-DE');
  $('range').textContent=pts.length?date(pts[0].tst)+' · '+time(pts[0].tst)+' bis '+date(pts.at(-1).tst)+' · '+time(pts.at(-1).tst)+' Uhr':'Für diesen Zeitraum sind noch keine Standortpunkte vorhanden.';
  $('quality').textContent='Bereinigte GPS-Näherung, keine berechnete Straßenstrecke. '+model.poorFixCount+' ungenaue Punkte · '+model.outlierCount+' isolierte Sprünge · '+model.suppressedJitterCount+' kleine GPS-Bewegungen geglättet. '+model.gapCount+' Lücken oder unplausible Übergänge werden nicht verbunden.'+(model.unknownAccuracyCount?' Bei '+model.unknownAccuracyCount+' Punkten fehlt die Genauigkeitsangabe.':'')+' Aufenthalte sind eine Näherung ab 10 Minuten im Bereich von ca. 100 m, nur bis zur letzten passenden Messung.'+(data.truncated?' Anzeige auf die neuesten 20.000 Punkte gekürzt. Bitte wähle einen einzelnen Tag.':'');
  renderTimeline(data,models);renderAnalysis(model,journal,selection);renderArchive(data);renderHealth(data.health,{selectedPart:Boolean(selection)});
  const chosenDay=active==='today'?today():active,archiveRevision=data.archive?.days.find(e=>e.date===chosenDay)?.revision;
  context.setDay({date:chosenDay,segment:selection,journal:data.journal,recorder:data.selectedRecorder??null,archiveRevision});
  const latestFix=pts.at(-1),sensor=[];
  if(Number.isFinite(latestFix?.batt))sensor.push('Akku '+fmt.format(latestFix.batt)+' %');
  if(Number.isFinite(latestFix?.alt))sensor.push('Höhe '+fmt.format(latestFix.alt)+' m ü. M.');
  if(Number.isFinite(latestFix?.vel))sensor.push('Geschwindigkeit '+fmt.format(latestFix.vel)+' km/h');
  $('sensor-details').textContent=sensor.length?'Letzter gewählter Messpunkt · '+time(latestFix.tst)+' Uhr: '+sensor.join(' · '):'Keine zusätzlichen GPS-Sensorwerte am letzten gewählten Messpunkt.';
  if(!map||view!=='day')return;
  const presentation=renderJourneyMap({L,layers,data,models,selection,onSelect:id=>selectSegment(id,{focus:true}),time,date});mapBounds=presentation.bounds;
  $('map-message').hidden=mapBounds.isValid();$('map-message').textContent=pts.length?'Die gewählten Punkte sind für eine Route zu ungenau.':'Noch keine Punkte in diesem Zeitraum.';
  if(force||first){fit();first=false;}
}
function locked(){
  dataController?.abort();
  mapBounds=null;requestedRecorder=null;recorderChoices=[];$('recorder').replaceChildren();$('recorder').disabled=true;$('recorder-control').hidden=true;$('recorder-note').textContent='';$('map-mode').textContent='Geschützt';$('map-route-note').textContent='';
  generation++;pendingRefresh=false;accessReady=false;disposeBasemap();if(map){map.remove();map=null;layers=null;}$('map-provider').disabled=true;$('basemap-status').dataset.state='idle';$('basemap-status').textContent='Karte nach der Anmeldung öffnen.';$('map-retry').hidden=true;statistics.reset();context.reset();workspace.reset();contextReady=false;for(const name of ['workspace','day','statistics'])$('view-'+name).disabled=true;$('calendar-day').disabled=true;updateDayNavigation();$('timeline-date-label').textContent='Deine Zeitachse';$('timeline-day-summary').textContent='Melde dich an, um deine Wege und Aufenthalte zu sehen.';$('map-selection-summary').textContent='Deine privaten Abschnitte erscheinen nach der Anmeldung.';$('sensor-details').textContent='';showView('overview');
  resetHealth('Melde dich über Mein Konto an oder öffne deinen privaten Kartenlink für deine Health-Werte.');
  status('Geschützter Zugriff');$('access').hidden=false;$('day').disabled=true;layers?.clearLayers();currentData=null;selected=null;$('timeline').replaceChildren();$('journal-summary').textContent='Zugriff erforderlich';$('archive-status').textContent='Melde dich über Mein Konto an oder öffne deinen privaten Kartenlink.';$('download-gpx').hidden=true;$('download-json').hidden=true;
  for(const id of ['distance','count','latest','received','range'])$(id).textContent='–';$('total').textContent='Zugriff erforderlich';$('map-message').hidden=false;$('map-message').textContent='Melde dich über Mein Konto an oder öffne deinen privaten Kartenlink.';
  for(const id of ['recording-check','recording-source','recording-receipt','analysis-span','analysis-stays','analysis-gaps','analysis-interval','analysis-average'])if($(id))$(id).textContent='–';
  if($('recording-title')){$('recording-title').textContent='Privater Empfangsstatus';$('recording-message').textContent='Melde dich über Mein Konto an oder öffne deinen privaten Kartenlink.';$('recording-observation').textContent='';}
}
async function authorizeAccess(revision){
  const response=await fetch('/assistenz/session',{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(revision!==generation)return false;if(response.status===401){locked();return false;}if(!response.ok)throw new Error('session-unavailable');
  const session=await response.json();if(revision!==generation)return false;if(session.canRead!==true){locked();return false;}
  accessReady=true;$('access').hidden=true;for(const name of ['workspace','day','statistics'])$('view-'+name).disabled=false;
  $('day').disabled=false;$('calendar-day').disabled=false;updateDayNavigation();
  await workspace.setSession(session);if(revision!==generation)return false;
  if(!contextReady){contextReady=true;await context.unlock();if(revision!==generation)return false;await context.setDay({date:active==='today'?today():active});if(revision!==generation)return false;}
  return true;
}
async function refresh(force=false){
  if(document.hidden)return;if(busy){if(force)pendingRefresh=true;return;}busy=true;const revision=generation;
  try{
    if(!await authorizeAccess(revision))return;
    context.refresh();if(force)workspace.refresh();
    dataController=new AbortController();
    const d=active==='today'?today():active,r=await fetch('/assistenz/data?'+recorderQuery(d,requestedRecorder),{cache:'no-store',signal:AbortSignal.any([dataController.signal,AbortSignal.timeout(10000)])});
    if(revision!==generation)return;if(r.status===401){locked();return;}if(!r.ok)throw new Error('gps-unavailable');
    const data=await r.json();if(revision!==generation)return;renderFreshness(data);currentData=data;status('Assistent verbunden · Aufzeichnungen geladen','ok');
    const key=JSON.stringify([d,data.totalStored,data.totalSelected,data.latestReceivedAt,data.archive,data.health,data.recorders,data.selectedRecorder]);
    if(force||lastView!==key){draw(data,force);lastView=key;statistics.invalidate(key);}statistics.refresh();
  }catch(error){
    if(revision===generation){
      status(navigator.onLine?(contextReady?'Notizen bereit · GPS gerade nicht erreichbar':'Verbindung gerade nicht erreichbar'):'Offline · Entwürfe bleiben im geöffneten Tab','error');
      $('map-message').hidden=false;$('map-message').textContent=currentData?'Gerade kein neuer Abgleich. Der zuletzt geladene Stand bleibt sichtbar.':'GPS-Daten sind gerade nicht erreichbar. Notizen und Aufgaben bleiben unabhängig davon verfügbar.';
      if(!currentData){$('total').textContent='GPS-Dienst nicht erreichbar';$('journal-summary').textContent='GPS-Daten gerade nicht verfügbar';$('archive-status').textContent='Archivstatus gerade nicht abrufbar.';resetHealth('Health-Daten sind gerade nicht abrufbar. Gespeicherte Werte bleiben erhalten.');}
    }
  }finally{busy=false;if(revision===generation&&accessReady)$('recorder').disabled=false;if(pendingRefresh){pendingRefresh=false;queueMicrotask(()=>refresh(true));}}
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
showView('overview');$('calendar-day').value=today();updateDayNavigation();
try{if(key)await unlock(key);else await refresh(true);key=null;if(ownerKey&&contextReady){try{await context.enableOwner(ownerKey);await authorizeAccess(generation);}catch(e){$('context-message').textContent=e.message;}}}catch(e){locked();$('login-error').textContent=e.message;}finally{key=null;ownerKey=null;}
setInterval(()=>refresh(),15000);
