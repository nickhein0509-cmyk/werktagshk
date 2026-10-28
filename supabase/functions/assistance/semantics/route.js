export function metres(a,b){const r=Math.PI/180,x=(b.lat-a.lat)*r,y=(b.lon-a.lon)*r,h=Math.sin(x/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(y/2)**2;return 6371000*2*Math.asin(Math.sqrt(Math.min(1,h)));}
export function route(points){
  const segments=[];let part=[],previous=null,distance=0,uncertain=0,gaps=0;
  const flush=()=>{if(part.length)segments.push(part);part=[];previous=null;};
  for(const p of points){
    if(p.acc>100){uncertain++;flush();continue;}
    if(previous){const dt=p.tst-previous.tst,d=metres(previous,p);if(dt>900||dt<=0||(dt>0&&d/dt>70)){gaps++;flush();}else distance+=d;}
    part.push(p);previous=p;
  }
  flush();return {segments,distance,uncertain,gaps};
}

// Display-only analysis. Keep route() above unchanged: archived journals use it.
// Distances join measured points, not roads. Covered time includes observed stops;
// it never fills a recording gap or extends a stay beyond its last measurement.
export function analyzeRoute(points, { journal } = {}) {
  const rows = Array.isArray(points) ? points : [];
  const maxGap = 900, maxAccuracy = 100, maxSpeed = 70;
  const valid = p => p && Number.isFinite(p.tst) && p.tst >= 0 &&
    Number.isFinite(p.lat) && Math.abs(p.lat) <= 90 &&
    Number.isFinite(p.lon) && Math.abs(p.lon) <= 180 &&
    (p.acc === undefined || (Number.isFinite(p.acc) && p.acc >= 0 && p.acc <= maxAccuracy));
  const accuracy = p => p.acc === undefined ? 15 : p.acc;
  const stays = Array.isArray(journal?.stays) ? journal.stays.filter(s =>
    Number.isInteger(s.startIndex) && Number.isInteger(s.endIndex) &&
    s.startIndex >= 0 && s.endIndex >= s.startIndex && s.endIndex < rows.length) : [];
  const inSameStay = (a, b) => stays.some(s => a >= s.startIndex && b <= s.endIndex);
  const rawDistance = route(rows.map(p => valid(p) ? p : { acc: Infinity })).distance;
  const segments = [], intervals = [];
  let part = [], previous = null, previousIndex = -1, anchor = null;
  let distanceMetres = 0, coveredSeconds = 0, gapCount = 0, gapSeconds = 0;
  let poorFixCount = 0, outlierCount = 0, suppressedJitterCount = 0, unknownAccuracyCount = 0;
  let firstTimestamp = null, lastTimestamp = null;
  const flush = () => { if (part.length) segments.push(part); part = []; anchor = null; };
  for (let i = 0; i < rows.length; i++) {
    const p = rows[i];
    if (!valid(p)) { poorFixCount++; flush(); previous = null; previousIndex = -1; continue; }
    if (p.acc === undefined) unknownAccuracyCount++;
    firstTimestamp = Math.min(firstTimestamp ?? p.tst, p.tst);
    lastTimestamp = Math.max(lastTimestamp ?? p.tst, p.tst);
    const next = rows[i + 1];
    if (previous && valid(next)) {
      const a = p.tst - previous.tst, b = next.tst - p.tst, span = next.tst - previous.tst;
      // Drop only an isolated impossible spike with a plausible adjacent bridge.
      // Never bridge an inaccurate point or a gap longer than the existing limit.
      if (a > 0 && b > 0 && span <= maxGap &&
          metres(previous, p) / a > maxSpeed && metres(p, next) / b > maxSpeed &&
          metres(previous, next) / span <= maxSpeed) { outlierCount++; continue; }
    }
    if (previous) {
      const dt = p.tst - previous.tst, d = metres(previous, p);
      if (dt <= 0 || dt > maxGap || d / dt > maxSpeed) {
        gapCount++; if (dt > maxGap) gapSeconds += dt;
        flush(); previous = null;
      } else {
        coveredSeconds += dt; intervals.push(dt);
        if (inSameStay(previousIndex, i)) {
          // The existing journal supplies this approximate stay evidence.
          // Keep its boundary for the next departure without drawing drift within it.
          if (part.length > 1) segments.push(part);
          part = [p]; anchor = p;
        } else {
          const displacement = metres(anchor ?? previous, p);
          const noise = Math.max(5, Math.min(25, (accuracy(anchor ?? previous) + accuracy(p)) / 2));
          if (displacement <= noise) suppressedJitterCount++;
          else { distanceMetres += displacement; part.push(p); anchor = p; }
        }
      }
    }
    if (!previous) { part = [p]; anchor = p; }
    previous = p; previousIndex = i;
  }
  flush();
  intervals.sort((a, b) => a - b);
  const middle = Math.floor(intervals.length / 2);
  return {
    distanceMetres,
    rawDistanceMetres: Number.isFinite(rawDistance) ? rawDistance : 0,
    elapsedSeconds: firstTimestamp === null ? 0 : lastTimestamp - firstTimestamp,
    coveredSeconds, gapCount, gapSeconds, poorFixCount, outlierCount,
    suppressedJitterCount, unknownAccuracyCount,
    medianIntervalSeconds: intervals.length ? (intervals.length % 2 ? intervals[middle] : (intervals[middle - 1] + intervals[middle]) / 2) : null,
    averageSpeedKmh: coveredSeconds > 0 ? distanceMetres / coveredSeconds * 3.6 : null,
    segments,
  };
}
