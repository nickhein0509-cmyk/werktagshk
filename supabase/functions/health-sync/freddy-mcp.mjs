import { HEALTH_METRICS, HEALTH_SOURCE, parseFreddyHealthSnapshot } from './health-parser.mjs';
import { sourceMetadata } from './freddy.mjs';

const fail = code => { throw Object.assign(new Error(code), { code }); };
export function validMcpConnection(value) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === 3 && value.kind === 'mcp' &&
    typeof value.url === 'string' && /^https:\/\/freddy\.coach\/mcp\/[A-Za-z0-9_-]{1,128}$/.test(value.url) &&
    typeof value.token === 'string' && /^[A-Za-z0-9._~-]{24,512}$/.test(value.token);
}

async function readBody(response) {
  const limit = 3 * 1024 * 1024;
  if (Number(response.headers.get('content-length')) > limit) fail('HEALTH_SOURCE_TOO_LARGE');
  if (!response.body) return '';
  const reader = response.body.getReader(), chunks = []; let length = 0;
  try {
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); fail('HEALTH_SOURCE_TOO_LARGE'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

function decodeMessage(text, contentType, id) {
  let messages;
  try {
    messages = contentType.includes('text/event-stream')
      ? text.replace(/\r\n/g, '\n').split('\n\n').filter(block => /^data:/m.test(block)).map(block => JSON.parse(block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n')))
      : [JSON.parse(text)];
  } catch { fail('HEALTH_SOURCE_FORMAT'); }
  const matches = messages.filter(message => message?.id === id);
  if (matches.length !== 1 || matches[0].jsonrpc !== '2.0' || matches[0].error || !matches[0].result) fail('HEALTH_SOURCE_FORMAT');
  return matches[0].result;
}

function toolText(result) {
  if (result?.isError) fail('HEALTH_SOURCE_UNAVAILABLE');
  if (!Array.isArray(result?.content)) fail('HEALTH_SOURCE_FORMAT');
  const parts = result.content.filter(item => item.type === 'text' && typeof item.text === 'string');
  if (!parts.length) fail('HEALTH_SOURCE_FORMAT');
  return parts.map(item => item.text).join('\n');
}

export function freddyMcpClient(connection, fetcher = fetch) {
  if (!validMcpConnection(connection)) fail('HEALTH_KEY_INVALID');
  let nextId = 0, session, initialized = false, deadline;
  async function request(method, params = {}, notification = false) {
    const id = notification ? undefined : ++nextId;
    const headers = { Authorization: `Bearer ${connection.token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-03-26' };
    if (session) headers['Mcp-Session-Id'] = session;
    let response;
    try {
      response = await fetcher(connection.url, { method: 'POST', headers, body: JSON.stringify({jsonrpc:'2.0', ...(notification ? {} : {id}), method, params}), redirect: 'error', signal: deadline });
    } catch { fail('HEALTH_SOURCE_UNAVAILABLE'); }
    if (response.status === 401 || response.status === 403) fail('HEALTH_KEY_INVALID');
    if (response.status === 429) fail('HEALTH_SOURCE_RATE_LIMITED');
    if (!response.ok) fail('HEALTH_SOURCE_UNAVAILABLE');
    if (method === 'initialize') {
      session = response.headers.get('mcp-session-id');
      if (session && (session.length > 256 || /[\r\n]/.test(session))) fail('HEALTH_SOURCE_FORMAT');
    }
    const text = await readBody(response);
    if (notification && !text) return;
    return decodeMessage(text, response.headers.get('content-type') ?? '', id);
  }
  async function initialize() {
    if (initialized) return;
    deadline = AbortSignal.timeout(45000);
    const result = await request('initialize', {protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'WerkTag',version:'0.15.0'}});
    if (result.protocolVersion !== '2025-03-26' || !result.capabilities?.tools) fail('HEALTH_SOURCE_FORMAT');
    await request('notifications/initialized', {}, true); initialized = true;
  }
  const call = async (name, args = {}) => {
    const result = await request('tools/call', {name, arguments:args});
    if (result.isError) fail('HEALTH_SOURCE_UNAVAILABLE');
    return result;
  };
  return {
    async check() {
      await initialize();
      const profile = (await call('get_profile')).structuredContent;
      if (!profile || profile.account?.deviceTimezone !== 'Europe/Berlin') fail('HEALTH_SOURCE_FORMAT');
      if (profile.consent?.upToDate !== true) fail('HEALTH_CONSENT_REQUIRED');
      const source = sourceMetadata({sources:profile.sources});
      const catalog = toolText(await call('list_metrics', {provider:'apple-health'}));
      // Never interpret an incomplete catalogue as absence of stored metrics.
      if (/\btruncated\b|not fully listed|continue.*\bafter\b/i.test(catalog)) fail('HEALTH_INCOMPLETE_QUERY');
      const names = new Set([...catalog.matchAll(/^([a-z][a-z0-9_]*):/gm)].map(match => match[1]));
      const metrics = Object.keys(HEALTH_METRICS).filter(name => names.has(name));
      if (!/^Available metrics:|^No (?:health )?(?:data|metrics)/i.test(catalog)) fail('HEALTH_SOURCE_FORMAT');
      const historyWindowDays = Number.isSafeInteger(profile.entitlements?.historyDays) && profile.entitlements.historyDays > 0 ? profile.entitlements.historyDays : null;
      return {...source, metrics, historyWindowDays, historyFloor:null};
    },
    async snapshot({fetchedAt = new Date().toISOString(), days = 7} = {}) {
      const checked = await this.check();
      if (!checked.metrics.length) return {...checked, fetchedAt, days:[]};
      const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Berlin', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date(fetchedAt));
      const count = Math.min(days, checked.historyWindowDays ?? days);
      const from = new Date(Date.parse(today + 'T12:00:00Z') - (count - 1) * 86400000).toISOString().slice(0,10);
      const queryText = toolText(await call('query_metrics', {metrics:checked.metrics, start:from, end:today, include_raw:false}));
      const parsed = parseFreddyHealthSnapshot({schemaVersion:1,provider:'APPLE_HEALTH',timezone:'Europe/Berlin',fetchedAt,sourceLastSyncAt:checked.sourceLastSyncAt,sourceLastDataAt:checked.sourceLastDataAt,queryText});
      for (const date of parsed.days.keys()) if (date < from || date > today) fail('HEALTH_SOURCE_FORMAT');
      const result = [...parsed.days].map(([date,metrics]) => ({schemaVersion:1,date,source:HEALTH_SOURCE,provider:'APPLE_HEALTH',timezone:'Europe/Berlin',fetchedAt:parsed.fetchedAt,sourceLastSyncAt:parsed.sourceLastSyncAt,sourceLastDataAt:parsed.sourceLastDataAt,metrics}));
      return {...checked, fetchedAt, days:result};
    },
  };
}
