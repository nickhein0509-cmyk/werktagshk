import test from 'node:test';
import assert from 'node:assert/strict';
import {freddyMcpClient,validMcpConnection} from './freddy-mcp.mjs';
import {connectionFromBody} from './connection.mjs';
import {createHealthSyncHandler} from './handler.mjs';
const connection={kind:'mcp',url:'https://freddy.coach/mcp/synthetic',token:'synthetic-token-1234567890123456'};
const stamp='2026-10-29T08:00:00.000Z';
const profile={account:{deviceTimezone:'Europe/Berlin'},consent:{upToDate:true},entitlements:{historyDays:7},sources:[{provider:'APPLE_HEALTH',status:'connected',lastSyncAt:stamp,lastDataAt:stamp}]};
const query='Health data (from 2026-10-23 to 2026-10-29):\n2026-10-28:\n  steps_total: 1234 count (Apple Health · Merged (HealthKit daily statistics))';
function fixture({sse=true,queryText=query,consent=true,wrongId=false,providerError=false}={}) {
 const calls=[];
 const fetcher=async(url,options)=>{
  assert.equal(url,connection.url); assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer '+connection.token);
  const body=JSON.parse(options.body);calls.push(body);
  if(body.method==='notifications/initialized'){assert.equal(options.headers['Mcp-Session-Id'],'synthetic-session');return new Response(null,{status:202});}
  let result;
  if(body.method==='initialize')result={protocolVersion:'2025-03-26',capabilities:{tools:{}}};
  else if(body.params.name==='get_profile')result={content:[],structuredContent:{...profile,consent:{upToDate:consent}}};
  else if(body.params.name==='list_metrics')result={content:[{type:'text',text:'Available metrics: 1 from Apple Health.\nsteps_total: 6 records'}]};
  else {assert.equal(body.params.name,'query_metrics');assert.deepEqual(body.params.arguments,{metrics:['steps_total'],start:'2026-10-23',end:'2026-10-29',include_raw:false});result={content:[{type:'text',text:queryText}],isError:providerError};}
  const message={jsonrpc:'2.0',id:wrongId?999:body.id,result};
  return new Response(sse?'event: message\r\ndata: '+JSON.stringify(message)+'\r\n\r\n':JSON.stringify(message),{headers:{'content-type':sse?'text/event-stream':'application/json','mcp-session-id':'synthetic-session'}});
 };
 return {calls,fetcher};
}
for(const sse of [true,false])test(`MCP ${sse?'SSE':'JSON'} performs read-only handshake, discovery and complete bounded import`,async()=>{
 const f=fixture({sse}),snapshot=await freddyMcpClient(connection,f.fetcher).snapshot({fetchedAt:stamp});
 assert.equal(snapshot.days.length,1);assert.equal(snapshot.days[0].metrics.steps_total.value,1234);
 assert.equal(snapshot.sourceLastSyncAt,stamp);assert.equal(snapshot.historyWindowDays,7);
 assert.deepEqual(f.calls.filter(c=>c.method==='tools/call').map(c=>c.params.name),['get_profile','list_metrics','query_metrics']);
 assert.equal(JSON.stringify(snapshot).includes(connection.token),false);
});
test('MCP rejects arbitrary endpoints, malformed credentials and mixed configuration bodies',()=>{
 for(const url of ['http://freddy.coach/mcp/id','https://evil.test/mcp/id','https://freddy.coach.evil.test/mcp/id','https://freddy.coach/mcp/id?token=x','https://freddy.coach/mcp/../api'])assert.equal(validMcpConnection({...connection,url}),false);
 assert.equal(connectionFromBody({mcpUrl:connection.url,mcpToken:connection.token,apiKey:'fk_live_synthetic_1234567890'}),null);
 assert.equal(JSON.parse(connectionFromBody({mcpUrl:connection.url,mcpToken:connection.token})).kind,'mcp');
});
test('MCP rejects partial results, wrong response IDs and provider tool failures',async()=>{
 for(const options of [{queryText:query+'\ntruncated'},{wrongId:true},{providerError:true}])await assert.rejects(freddyMcpClient(connection,fixture(options).fetcher).snapshot({fetchedAt:stamp}),/HEALTH_/);
});
test('MCP never accepts provider terms or reads metrics without current user consent',async()=>{
 const f=fixture({consent:false});await assert.rejects(freddyMcpClient(connection,f.fetcher).snapshot({fetchedAt:stamp}),/HEALTH_CONSENT_REQUIRED/);
 assert.deepEqual(f.calls.filter(c=>c.method==='tools/call').map(c=>c.params.name),['get_profile']);
});
test('MCP configuration is owner-gated and persisted only after validation, then cron imports it',async()=>{
 const installation='11111111-1111-4111-8111-111111111111',user='22222222-2222-4222-8222-222222222222',f=fixture();
 let stored,committed,owned=true;
 const fetcher=async(url,options)=>{
  if(String(url).startsWith('https://freddy.coach/'))return f.fetcher(url,options);
  const path=new URL(url).pathname,body=options.body?JSON.parse(options.body):null;
  if(path==='/auth/v1/user')return Response.json({id:user});
  if(path.endsWith('/assistance_installations'))return Response.json(owned?[{id:installation}]:[]);
  if(path.endsWith('/assistance_health_configure')){stored=body.p_api_key;return Response.json(null);}
  if(path.endsWith('/assistance_health_claim'))return Response.json({claimed:true,apiKey:stored,leaseToken:installation});
  if(path.endsWith('/assistance_health_commit_sync')){committed=body.p_days;return Response.json({committed:true});}
  if(path.endsWith('/assistance_health_status'))return Response.json({configured:true,enabled:true,connectionKind:'mcp'});
  assert.fail('unexpected database route');
 };
 const handler=createHealthSyncHandler({supabaseUrl:'https://test-project.supabase.co',serviceKey:'server-only',fetcher,now:()=>stamp});
 const request=()=>new Request('https://test-project.supabase.co/functions/v1/health-sync?route=configure',{method:'POST',headers:{Authorization:'Bearer owner',Origin:'https://werk-tag.com'},body:JSON.stringify({mcpUrl:connection.url,mcpToken:connection.token})});
 owned=false;assert.equal((await handler(request())).status,403);assert.equal(f.calls.length,0);assert.equal(stored,undefined);
 owned=true;const response=await handler(request());assert.equal(response.status,200);assert.deepEqual(JSON.parse(stored),connection);assert.equal(committed[0].metrics.steps_total.value,1234);assert.equal(JSON.stringify(await response.json()).includes(connection.token),false);
});
