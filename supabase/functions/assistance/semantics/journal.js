import { metres, route } from './route.js';
export const settings = Object.freeze({ radiusMetres: 100, minStaySeconds: 600, maxGapSeconds: 900, maxAccuracyMetres: 100, maxSpeedMetresPerSecond: 70 });
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Berlin', year:'numeric',month:'2-digit',day:'2-digit' });
export const dayOf = tst => dayFmt.format(new Date(tst*1000));

function describe(kind, points, start, end, reason, crossesMidnight=false) {
  const first=points[start],last=points[end];
  const entry={id:dayOf(first.tst)+'-'+kind+'-'+first.tst,kind,day:dayOf(first.tst),startIndex:start,endIndex:end,startTimestamp:first.tst,endTimestamp:last.tst,durationSeconds:last.tst-first.tst,pointCount:end-start+1,endReason:reason};
  if(kind==='trip'){
    let distanceMetres=0;for(let i=start+1;i<=end;i++)distanceMetres+=metres(points[i-1],points[i]);
    entry.distanceMetres=distanceMetres;
  }else{
    let lat=0,lon=0;for(let i=start;i<=end;i++){lat+=points[i].lat;lon+=points[i].lon;}
    entry.center={lat:lat/entry.pointCount,lon:lon/entry.pointCount};
    entry.minimumEvidenceSeconds=settings.minStaySeconds;
    entry.crossesMidnight=crossesMidnight;
  }
  return entry;
}

export function buildJournal(points) {
  const trips=[],stays=[];let chunk=[],uncertain=0,gaps=0;
  function emit(kind,start,end,reason,recognizedDurationSeconds){
    for(let a=start;a<=end;){
      let b=a;const day=dayOf(points[a].tst);
      while(b+1<=end&&dayOf(points[b+1].tst)===day)b++;
      if(kind==='stay'||b>a)(kind==='trip'?trips:stays).push(describe(kind,points,a,b,b<end?'day-end':reason,dayOf(points[start].tst)!==dayOf(points[end].tst)));
      a=b+1;
    }
  }
  function flush(reason){
    if(!chunk.length)return;
    let cursor=0,i=0;
    while(i<chunk.length){
      let j=i+1;while(j<chunk.length&&metres(points[chunk[i]],points[chunk[j]])<=settings.radiusMetres)j++;
      const duration=points[chunk[j-1]].tst-points[chunk[i]].tst;
      if(duration>=settings.minStaySeconds){
        if(i>cursor)emit('trip',chunk[cursor],chunk[i],'stay');
        emit('stay',chunk[i],chunk[j-1],j<chunk.length?'departure':reason,duration);
        cursor=j-1;
      }
      // Fixed anchor; reset only when leaving its 100 m circle.
      i=j;
    }
    if(cursor<chunk.length-1)emit('trip',chunk[cursor],chunk.at(-1),reason);
    chunk=[];
  }
  for(let i=0;i<points.length;i++){
    const p=points[i];
    if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||p.acc>settings.maxAccuracyMetres){uncertain++;flush('poor-fix');continue;}
    if(chunk.length){
      const prev=points[chunk.at(-1)],dt=p.tst-prev.tst;
      if(dt<=0||dt>settings.maxGapSeconds||metres(prev,p)/dt>settings.maxSpeedMetresPerSecond){gaps++;flush('gap');}
    }
    chunk.push(i);
  }
  flush('latest-fix');
  return {settings,trips,stays,uncertain,gaps};
}

export function clipJournal(journal, points, from, to) {
  const clip=entries=>entries.filter(e=>e.endIndex>=from&&e.startIndex<=to).flatMap(e=>{
    const a=Math.max(from,e.startIndex),b=Math.min(to,e.endIndex);
    if(e.kind==='trip'&&a===b)return [];
    const part=describe(e.kind,points,a,b,e.endReason,e.crossesMidnight);
    return [{...part,id:e.id,startIndex:a-from,endIndex:b-from}];
  });
  const quality=route(points.slice(from,to+1));
  return {...journal,trips:clip(journal.trips),stays:clip(journal.stays),uncertain:quality.uncertain,gaps:quality.gaps};
}
