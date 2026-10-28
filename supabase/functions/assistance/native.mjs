const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function fail(message='Ungültige Übertragung.'){throw Object.assign(new Error(message),{status:400});}
function keys(v,allowed){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!allowed.includes(k)))fail();}
export async function validateNativeBatch(body,{now,normalizeLocation,sha256}){
 keys(body,['schemaVersion','deviceId','events']);
 if(body.schemaVersion!==1||!uuid.test(body.deviceId)||!Array.isArray(body.events)||body.events.length<1||body.events.length>100)fail();
 const seen=new Set(),rows=[];
 for(const e of body.events){
  keys(e,['id','kind','capturedAt','location','health']);
  if(!uuid.test(e.id)||seen.has(e.id.toLowerCase()))fail();
  seen.add(e.id.toLowerCase());
  if(typeof e.capturedAt!=='string'||!e.capturedAt.endsWith('Z')||!Number.isFinite(Date.parse(e.capturedAt))||Date.parse(e.capturedAt)<946684800000||Date.parse(e.capturedAt)>now+300000)fail();
  let payload;
  if(e.kind==='location'){
   if(e.health!==undefined)fail();
   keys(e.location,['tst','lat','lon','acc','alt','vel','cog']);
   payload=await normalizeLocation({...e.location,_type:'location'},'werktag_ios',body.deviceId.toLowerCase(),now);
   if(!payload||payload.acc===undefined||payload.tst>Math.floor(now/1000)+300)fail();
  }else if(e.kind==='health'){
   if(e.location!==undefined)fail();
   keys(e.health,['date','timezone','steps','activeEnergyKcal','heartRateBpm']);
   const h=e.health;
   if(h.timezone!=='Europe/Berlin'||typeof h.date!=='string'||!/^\d{4}-\d\d-\d\d$/.test(h.date)||!Number.isFinite(Date.parse(h.date))||new Date(h.date).toISOString().slice(0,10)!==h.date||Date.parse(h.date)<946684800000||Date.parse(h.date)>now+86400000)fail();
   payload={date:h.date,timezone:h.timezone};
   for(const [key,max] of [['steps',1000000],['activeEnergyKcal',100000],['heartRateBpm',300]]){
    if(h[key]!==undefined&&h[key]!==null){
     if(!Number.isFinite(h[key])||h[key]<0||h[key]>max||(key==='steps'&&!Number.isSafeInteger(h[key])))fail();
     payload[key]=h[key];
    }
   }
  }else fail();
  const row={id:e.id.toLowerCase(),deviceId:body.deviceId.toLowerCase(),kind:e.kind,capturedAt:new Date(e.capturedAt).toISOString(),payload};
  rows.push({...row,hash:await sha256(JSON.stringify(row))});
 }
 return rows;
}

