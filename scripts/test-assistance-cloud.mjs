import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { readFile } from 'node:fs/promises';
import { createCloudProxy, cloudCookie } from '../server/assistance-cloud.mjs';
import account from '../api/assistenz-account.mjs';
import { CATALOGUE_CSP } from '../supabase/functions/assistance/catalog.mjs';

const endpoint = 'https://synthetic.supabase.co/functions/v1/werktag-assistance';
const origin = 'https://werk-tag.com';
function request(url = '/assistenz/data', method = 'GET', headers = {}, chunks = []) {
  const req = Readable.from(chunks);
  return Object.assign(req, { url, method, headers });
}
function response() {
  return { headers: {}, setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
    end(bytes) { this.body = Buffer.isBuffer(bytes) ? bytes.toString('utf8') : bytes ?? ''; } };
}
const json = (value = {}, init = {}) => new Response(JSON.stringify(value), { ...init, headers: { 'content-type': 'application/json', ...init.headers } });

test('protected catalogue HTML restores its fixed MIME and policy after Edge gateway sanitizing', async () => {
  for (const route of ['map/components', 'map/components/view']) {
    for (const status of [200, 401]) {
      const html = '<!doctype html><h1>Synthetic catalogue or login</h1>';
      const proxy = createCloudProxy({ endpoint, fetchImpl: async () => new Response(html, { status, headers: {
        'content-type': 'text/plain', 'content-security-policy': "default-src 'none'; sandbox",
      } }) });
      const res = response(); await proxy(request(), res, route);
      assert.equal(res.statusCode, status); assert.equal(res.body, html);
      assert.equal(res.headers['content-type'], 'text/html; charset=utf-8');
      assert.equal(res.headers['content-security-policy'], CATALOGUE_CSP);
      assert.equal(res.headers['cache-control'], 'no-store');
    }
  }
});

test('catalogue errors stay JSON and ordinary cloud HTML never gains catalogue rendering', async () => {
  for (const [route, status, type, policy] of [
    ['map/components/view', 503, 'application/json', CATALOGUE_CSP],
    ['map/data', 200, 'text/plain', "default-src 'none'; sandbox"],
  ]) {
    const proxy = createCloudProxy({ endpoint, fetchImpl: async () => new Response('{}', { status, headers: {
      'content-type': type, 'content-security-policy': "default-src 'none'; sandbox",
    } }) });
    const res = response(); await proxy(request(), res, route);
    assert.equal(res.statusCode, status); assert.equal(res.body, '{}');
    assert.equal(res.headers['content-type'], type);
    assert.equal(res.headers['content-security-policy'], policy);
  }
});

test('cloud route and method allowlist rejects unsupported targets before any upstream call', async () => {
  let calls = 0;
  const proxy = createCloudProxy({ endpoint, fetchImpl: async () => { calls++; return json(); } });
  for (const [route, method] of [['export', 'GET'], ['status', 'GET'], ['map', 'GET'], ['map/app.js', 'GET'],
    ['map/../data', 'GET'], ['account/delete', 'POST'], ['health/import', 'POST'], ['pub', 'GET'],
    ['map/data', 'POST'], ['account/claim', 'GET'], ['health/disable', 'GET'], ['health/check', 'GET'], ['health/refresh', 'GET']]) {
    const res = response();
    await proxy(request('/api/assistenz', method, { origin }), res, route);
    assert.equal(res.statusCode, 405, route + ' ' + method);
    assert.equal(res.headers['cache-control'], 'no-store');
  }
  assert.equal(calls, 0);
});

test('manual context range preserves bounds and session while rejecting writes before upstream access', async () => {
  let seen, calls=0;
  const proxy=createCloudProxy({endpoint,fetchImpl:async(url,options)=>{calls++;seen={url,options};return json({schemaVersion:1,documents:[]});}});
  const res=response();
  await proxy(request('/assistenz/context-range?from=2026-10-01&to=2026-10-28','GET',{cookie:'learning=private; __Secure-werktag-assistance=synthetic-session',authorization:'Bearer unrelated'}),res,'map/context-range');
  assert.equal(res.statusCode,200);assert.equal(seen.url.searchParams.get('route'),'map/context-range');
  assert.equal(seen.url.searchParams.get('from'),'2026-10-01');assert.equal(seen.url.searchParams.get('to'),'2026-10-28');
  assert.equal(seen.options.headers.cookie,'__Secure-werktag-assistance=synthetic-session');assert.equal(seen.options.headers.authorization,undefined);
  const blocked=response();await proxy(request('/assistenz/context-range','POST',{origin}),blocked,'map/context-range');assert.equal(blocked.statusCode,405);assert.equal(calls,1);
});

test('browser mutations require exact origin and reject cross-site requests', async () => {
  let calls = 0;
  const proxy = createCloudProxy({ endpoint, fetchImpl: async () => { calls++; return json(); } });
  for (const route of ['map/auth', 'map/context', 'account/session', 'account/claim', 'health/configure', 'health/disable', 'health/check', 'health/refresh']) {
    for (const headers of [{}, { origin: 'https://other.example' }, { origin, 'sec-fetch-site': 'cross-site' }]) {
      const res = response(); await proxy(request('/api/assistenz', 'POST', headers), res, route);
      assert.equal(res.statusCode, 403, route);
    }
  }
  assert.equal(calls, 0);
});

test('owner Health checks and refreshes forward only to the Health function with exact body and bearer', async () => {
  const seen = [];
  const proxy = createCloudProxy({ endpoint, fetchImpl: async (url, options) => {
    seen.push({ route: url.searchParams.get('route'), options });
    return json({ ok: true });
  } });
  for (const [route, body] of [['health/check', { apiKey: 'fk_live_synthetic_test_key_only' }], ['health/refresh', {}]]) {
    const req = request('/api/assistenz-health', 'POST', { origin, authorization: 'Bearer synthetic.jwt.signature', 'content-type': 'application/json' });
    req.body = body;
    const res = response(); await proxy(req, res, route);
    assert.equal(res.statusCode, 200);
    const forwarded = seen.at(-1);
    assert.equal(forwarded.route, route.slice(7));
    assert.equal(forwarded.options.headers.authorization, 'Bearer synthetic.jwt.signature');
    assert.equal(forwarded.options.headers.origin, origin);
    assert.deepEqual(JSON.parse(forwarded.options.body.toString('utf8')), body);
    assert.doesNotMatch(res.body, /fk_live_|synthetic.jwt/);
  }
});

test('cloud endpoint configuration is HTTPS and function-path constrained', async () => {
  for (const invalid of ['', 'http://example.com/functions/v1/assistance', 'https://user:secret@example.com/functions/v1/assistance',
    'https://example.com/other', 'https://example.com/functions/v1/assistance?key=secret', 'https://example.com/functions/v1/assistance#private']) {
    let calls = 0; const res = response();
    const proxy = createCloudProxy({ endpoint: invalid, fetchImpl: async () => { calls++; return json(); } });
    await proxy(request(), res, 'map/data');
    assert.equal(res.statusCode, 503); assert.equal(calls, 0);
    assert.doesNotMatch(res.body, /user:secret|key=secret|#private/);
  }
});

test('OwnTracks forwards Basic, device identity and exact bytes without browser credentials', async () => {
  let seen;
  const payload = Buffer.from('{"_type":"location","tst":100,"lat":0,"lon":0,"tid":"ST"}');
  const proxy = createCloudProxy({ endpoint, fetchImpl: async (url, options) => { seen = { url, options }; return json([]); } });
  const res = response();
  await proxy(request('/api/assistenz/owntracks', 'POST', {
    authorization: 'Basic c3ludGhldGljOnN5bnRoZXRpYw==', cookie: '__Secure-werktag-assistance=private',
    'x-limit-d': 'synthetic-device', 'x-limit-u': 'synthetic-user', 'content-type': 'application/json',
    'content-encoding': 'identity', origin: 'https://irrelevant-owntracks-origin.example',
  }, [payload]), res, 'pub');
  assert.equal(res.statusCode, 200); assert.equal(seen.url.searchParams.get('route'), 'pub');
  assert.equal(seen.options.headers.authorization, 'Basic c3ludGhldGljOnN5bnRoZXRpYw==');
  assert.equal(seen.options.headers['x-limit-d'], 'synthetic-device');
  assert.equal(seen.options.headers['x-limit-u'], 'synthetic-user');
  assert.equal(seen.options.headers['content-encoding'], 'identity');
  assert.equal(seen.options.headers.cookie, undefined); assert.equal(seen.options.headers.origin, undefined);
  assert.deepEqual(seen.options.body, payload); assert.equal(res.body, '[]');
});

test('Bearer credentials belong only to account or Health control and Basic only to OwnTracks', async () => {
  const seen = [];
  const proxy = createCloudProxy({ endpoint, fetchImpl: async (url, options) => { seen.push({ route: url.searchParams.get('route'), headers: options.headers }); return json(); } });
  for (const route of ['pub', 'map/data', 'account/status', 'health/status']) {
    const res = response();
    await proxy(request('/api/assistenz', route === 'pub' ? 'POST' : 'GET', { authorization: 'Bearer synthetic.jwt.signature' }), res, route);
    assert.equal(res.statusCode, 200);
  }
  assert.equal(seen[0].headers.authorization, undefined);
  assert.equal(seen[1].headers.authorization, undefined);
  assert.equal(seen[2].headers.authorization, 'Bearer synthetic.jwt.signature');
  assert.equal(seen[3].headers.authorization, 'Bearer synthetic.jwt.signature');
  for (const authorization of ['Basic c3ludGhldGljOnB3', 'Bearer invalid token', 'Bearer token\nprivate']) {
    const res = response(); await proxy(request('/api/assistenz-account', 'GET', { authorization }), res, 'account/status');
    assert.equal(seen.at(-1).headers.authorization, undefined);
  }
});

test('only the dedicated assistance cookie is sent to the cloud', async () => {
  assert.equal(cloudCookie('learning=private; __Secure-nick-map=legacy; __Secure-werktag-assistance=session; other=x'), '__Secure-werktag-assistance=session');
  assert.equal(cloudCookie('__Secure-werktag-assistance-extra=wrong; prefixed=__Secure-werktag-assistance=wrong'), '');
  let seen;
  const proxy = createCloudProxy({ endpoint, fetchImpl: async (_url, options) => { seen = options; return json(); } });
  const res = response();
  await proxy(request('/assistenz/data', 'GET', { cookie: 'learning-auth=private; __Secure-werktag-assistance=synthetic-session; __Secure-nick-map-owner=legacy-owner' }), res, 'map/data');
  assert.equal(seen.headers.cookie, '__Secure-werktag-assistance=synthetic-session');
  assert.equal(seen.headers.authorization, undefined);
});

test('caller query parameters cannot replace the validated route', async () => {
  let seen;
  const proxy = createCloudProxy({ endpoint, fetchImpl: async url => { seen = url; return json(); } });
  const res = response();
  await proxy(request('/api/assistenz?path=export&route=pub&route=account/claim&date=2026-10-28&tag=a&tag=b'), res, 'map/data');
  assert.deepEqual(seen.searchParams.getAll('route'), ['map/data']);
  assert.equal(seen.searchParams.has('path'), false); assert.equal(seen.searchParams.get('date'), '2026-10-28');
  assert.deepEqual(seen.searchParams.getAll('tag'), ['a', 'b']);
});

test('JSON browser mutations preserve CSRF and use the configured public origin', async () => {
  let seen;
  const proxy = createCloudProxy({ endpoint, fetchImpl: async (_url, options) => { seen = options; return json(); } });
  const req = request('/assistenz/context', 'POST', { origin, 'content-type': 'application/json', 'x-csrf-token': 'synthetic-csrf' });
  req.body = { date: '2026-10-28', operation: 'create', text: 'synthetic only' };
  const res = response(); await proxy(req, res, 'map/context');
  assert.equal(seen.headers.origin, origin); assert.equal(seen.headers['sec-fetch-site'], 'same-origin');
  assert.equal(seen.headers['x-csrf-token'], 'synthetic-csrf');
  assert.deepEqual(JSON.parse(seen.body), req.body); assert.equal(res.statusCode, 200);
});

test('streamed and parsed bodies are limited in actual bytes before upstream access', async () => {
  let calls = 0;
  const proxy = createCloudProxy({ endpoint, fetchImpl: async () => { calls++; return json(); } });
  const streamed = request('/api/assistenz/owntracks', 'POST', {}, [Buffer.alloc(131072), Buffer.alloc(131073)]);
  const parsed = request('/api/assistenz/owntracks', 'POST'); parsed.body = 'ü'.repeat(131073);
  for (const req of [streamed, parsed]) {
    const res = response(); await proxy(req, res, 'pub'); assert.equal(res.statusCode, 413);
  }
  assert.equal(calls, 0);
  const req = request('/api/assistenz/owntracks', 'POST'); req.body = Buffer.alloc(262144);
  const res = response(); await proxy(req, res, 'pub'); assert.equal(res.statusCode, 200); assert.equal(calls, 1);
});

test('upstream authentication failures preserve exact JSON and useful challenge headers', async () => {
  const payload = { error: 'Synthetic credentials rejected', note: '/map must stay JSON' };
  const proxy = createCloudProxy({ endpoint, fetchImpl: async () => json(payload, { status: 401, headers: { 'www-authenticate': 'Basic realm="synthetic"', 'retry-after': '60' } }) });
  const res = response(); await proxy(request('/api/assistenz/owntracks', 'POST'), res, 'pub');
  assert.equal(res.statusCode, 401); assert.deepEqual(JSON.parse(res.body), payload);
  assert.equal(res.headers['www-authenticate'], 'Basic realm="synthetic"'); assert.equal(res.headers['retry-after'], '60');
  assert.equal(res.headers['referrer-policy'], 'no-referrer'); assert.equal(res.headers['x-frame-options'], 'DENY');
});

test('only cloud assistance Set-Cookie values are returned and ingestion never sets browser sessions', async () => {
  const cookie = '__Secure-werktag-assistance=synthetic; Path=/assistenz; HttpOnly; Secure; SameSite=Strict';
  const proxy = createCloudProxy({ endpoint, fetchImpl: async () => {
    const headers = new Headers({ 'content-type': 'application/json' });
    headers.append('set-cookie', cookie); headers.append('set-cookie', '__Secure-nick-map=legacy; Path=/'); headers.append('set-cookie', 'unrelated=private; Path=/');
    return new Response('{}', { headers });
  } });
  const res = response(); await proxy(request('/assistenz/auth', 'POST', { origin }), res, 'map/auth');
  assert.deepEqual(res.headers['set-cookie'], [cookie]);
  const ingestion = response(); await proxy(request('/api/assistenz/owntracks', 'POST'), ingestion, 'pub');
  assert.equal(ingestion.headers['set-cookie'], undefined);
});

test('GPX and JSON downloads retain content disposition without text rewriting', async () => {
  const gpx = '<?xml version="1.0"?><gpx><name>/map literal stays unchanged</name></gpx>';
  const proxy = createCloudProxy({ endpoint, fetchImpl: async () => new Response(gpx, { headers: { 'content-type': 'application/gpx+xml', 'content-disposition': 'attachment; filename="synthetic.gpx"' } }) });
  const res = response(); await proxy(request('/assistenz/archive?date=2026-10-28&format=gpx'), res, 'map/archive');
  assert.equal(res.statusCode, 200); assert.equal(res.body, gpx); assert.match(res.headers['content-disposition'], /synthetic\.gpx/);
});

test('redirects, transport exceptions and excessive responses fail closed without details', async () => {
  const cases = [async () => new Response('', { status: 302, headers: { location: 'https://private.example/secret-target' } }),
    async () => { throw Error('private backend secret must not escape'); },
    async () => new Response('x'.repeat(4 * 1024 * 1024 + 1))];
  for (const fetchImpl of cases) {
    const res = response(); await createCloudProxy({ endpoint, fetchImpl })(request(), res, 'map/data');
    assert.equal(res.statusCode, 502); assert.doesNotMatch(res.body, /private\.example|secret-target|backend secret/);
    assert.equal(res.headers.location, undefined); assert.equal(res.headers['cache-control'], 'no-store');
  }
});

test('Health control uses its separately configured function endpoint and shortened route', async () => {
  const old = { cloud: process.env.ASSISTANCE_CLOUD_URL, health: process.env.ASSISTANCE_HEALTH_URL };
  process.env.ASSISTANCE_CLOUD_URL = endpoint;
  process.env.ASSISTANCE_HEALTH_URL = 'https://synthetic.supabase.co/functions/v1/werktag-health-sync';
  try {
    const seen = [];
    const proxy = createCloudProxy({ fetchImpl: async (url, options) => { seen.push({ url, options }); return json(); } });
    const res = response();
    await proxy(request('/api/assistenz-health?route=status', 'GET', { authorization: 'Bearer synthetic.jwt.signature' }), res, 'health/status');
    assert.equal(seen[0].url.pathname, '/functions/v1/werktag-health-sync');
    assert.equal(seen[0].url.searchParams.get('route'), 'status');
    assert.equal(seen[0].options.headers.authorization, 'Bearer synthetic.jwt.signature');
    const map = response(); await proxy(request(), map, 'map/data');
    assert.equal(seen[1].url.pathname, '/functions/v1/werktag-assistance');
    assert.equal(seen[1].url.searchParams.get('route'), 'map/data');
  } finally {
    if (old.cloud === undefined) delete process.env.ASSISTANCE_CLOUD_URL; else process.env.ASSISTANCE_CLOUD_URL = old.cloud;
    if (old.health === undefined) delete process.env.ASSISTANCE_HEALTH_URL; else process.env.ASSISTANCE_HEALTH_URL = old.health;
  }
});

test('account API rejects missing, array and unknown route selectors', async () => {
  for (const selector of [undefined, ['status', 'claim'], '../pub', 'delete']) {
    const req = request('/api/assistenz-account'); req.query = { route: selector };
    const res = response(); await account(req, res); assert.equal(res.statusCode, 405);
  }
});

test('static map dependencies resolve before API wildcard and retain original map security policy', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const wildcard = config.rewrites.findIndex(r => r.source === '/assistenz/:path*');
  const scripts = [await readFile(new URL('../assistance.html', import.meta.url), 'utf8'), ...await Promise.all(['app.js', 'context.js', 'statistics.js', 'health.js'].map(file => readFile(new URL('../public/assistance-assets/' + file, import.meta.url), 'utf8')))];
  const paths = new Set(scripts.flatMap(s => [...s.matchAll(/(?:src=|href=)["'](\/assistenz\/[^"']+)|(?:from\s+)["'](\/assistenz\/[^"']+)/g)].map(m => m[1] ?? m[2])).filter(p => /\.(?:js|css)$/.test(p)));
  for (const asset of paths) {
    const i = config.rewrites.findIndex(r => r.source === asset);
    assert.ok(i >= 0 && i < wildcard, 'Static dependency routed to API wildcard: ' + asset);
    assert.match(config.rewrites[i].destination, /^\/assistance-assets\//);
  }
  for (const source of ['/assistenz', '/assistenz/:path*', '/assistance-assets/:path*', '/assistance.html']) {
    const headers = Object.fromEntries(config.headers.find(h => h.source === source).headers.map(h => [h.key.toLowerCase(), h.value]));
    assert.equal(headers['cache-control'], 'no-store'); assert.equal(headers['referrer-policy'], 'no-referrer');
    assert.equal(headers['x-content-type-options'], 'nosniff'); assert.equal(headers['x-frame-options'], 'DENY');
    assert.match(headers['content-security-policy'], /script-src 'self'/); assert.match(headers['content-security-policy'], /frame-ancestors 'none'/);
    assert.match(headers['content-security-policy'], /https:\/\/tile\.openstreetmap\.org/);
    assert.doesNotMatch(headers['content-security-policy'], /unsafe-eval|script-src[^;]*unsafe-inline/);
  }
});
