import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createAssistance, hashSecret, sha256 } from './core.mjs';
import { CATALOGUE_FILES, CATALOGUE_SOURCE_SHA256, CATALOGUE_RESOURCE_LIMIT, cataloguePath, catalogueType, validateCatalogueResource } from './catalog.mjs';
import { createCloudProxy } from '../../../server/assistance-cloud.mjs';

const ID = '11111111-1111-4111-8111-111111111111';
const NOW = Date.parse('2026-10-28T12:00:00Z');
async function asset(path = 'index.html', body = '<h1>Synthetic private catalogue</h1>') {
  return { path, body, contentType: catalogueType(path), sha256: await sha256(body), sourceSha256: CATALOGUE_SOURCE_SHA256 };
}
const dbRow = value => ({ path: value.path, body: value.body, content_type: value.contentType, sha256: value.sha256, bytes: new TextEncoder().encode(value.body).length, source_sha256: value.sourceSha256 });
async function fixture() {
  const owner = 'o'.repeat(43), map = 'm'.repeat(43), salt = 's'.repeat(32);
  const installation = { id: ID, salt, owner_hash: await hashSecret(salt, owner), map_hash: await hashSecret(salt, map), owner_user_id: null };
  const sessions = new Map(), resources = new Map(), calls = [];
  let available = true;
  const store = {
    installation: async () => installation,
    session: async (_id, hash) => sessions.get(hash),
    putSession: async value => sessions.set(value.token_hash, value),
    catalogueResource: async (id, path) => { calls.push({ read: path, id }); return available && resources.size === 49 ? resources.get(path) : null; },
    importCatalogue: async (id, value) => {
      calls.push({ imported: value.path, id });
      const old = resources.get(value.path);
      if (old && (old.sha256 !== value.sha256 || old.body !== value.body)) return { conflict: true };
      resources.set(value.path, dbRow(value));
      return { stored: !old, resourceCount: resources.size, ready: resources.size === 49 };
    },
  };
  const handle = createAssistance({ store, installationId: ID, now: () => NOW });
  const request = (route, { method = 'GET', body, cookie } = {}) => handle(new Request('https://synthetic.supabase.co/functions/v1/assistance?route=' + route, {
    method, headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(cookie ? { cookie } : {}), origin: 'https://werk-tag.com' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
  async function unlock() { const response = await request('map/auth', { method: 'POST', body: { key: map } }); return response.headers.get('set-cookie').split(';')[0]; }
  async function fill() { for (const path of CATALOGUE_FILES) resources.set(path, dbRow(await asset(path, 'synthetic-' + path))); }
  return { owner, installation, store, calls, resources, sessions, request, unlock, fill, setAvailable: value => { available = value; } };
}

test('catalogue contract contains exactly49 canonical resources and explicit HTML aliases', () => {
  assert.equal(CATALOGUE_FILES.length, 49); assert.equal(new Set(CATALOGUE_FILES).size, 49);
  assert.equal(cataloguePath('map/components'), 'index.html'); assert.equal(cataloguePath('map/components/view'), 'index.html');
  assert.equal(cataloguePath('map/components/blocks/shk-shard-41.b64'), 'blocks/shk-shard-41.b64');
  for (const path of ['map/components/blocks/shk-shard-42.b64', 'map/components/../data', 'map/components/index.html', 'map/components/blocks/shk-shard-%30.b64']) assert.equal(cataloguePath(path), null);
});
test('owner proof precedes any catalogue import, and read sessions cannot upload', async () => {
  const f = await fixture(), value = await asset(), cookie = await f.unlock();
  assert.equal((await f.request('import-catalog', { method: 'POST', cookie, body: { ownerToken: 'wrong', ...value } })).status, 403);
  assert.equal(f.calls.length, 0);
  const r = await f.request('import-catalog', { method: 'POST', body: { ownerToken: f.owner, ...value } });
  assert.equal(r.status, 200); assert.deepEqual(await r.json(), { ok: true, stored: true, resourceCount: 1, ready: false });
});
test('import validates the fixed source, exact type, path and UTF8hash before storage', async () => {
  const f = await fixture(), value = await asset('app.js', 'const label="ä";');
  for (const change of [{ path: '../runtime/config.json' }, { sourceSha256: '0'.repeat(64) }, { sha256: '0'.repeat(64) }, { contentType: 'text/html; charset=utf-8' }, { body: '\uD800' }, { body: 'bad\0data' }]) {
    const r = await f.request('import-catalog', { method: 'POST', body: { ownerToken: f.owner, ...value, ...change } }); assert.equal(r.status, 400);
  }
  assert.equal(f.calls.length, 0);
  const v = await validateCatalogueResource(value); assert.equal(v.bytes, Buffer.byteLength(value.body));
});
test('actual bytes and complete JSONrequest are bounded before import', async () => {
  await assert.rejects(validateCatalogueResource(await asset('app.js', 'ü'.repeat(CATALOGUE_RESOURCE_LIMIT / 2 + 1))), error => error.status === 413);
  const f = await fixture();
  assert.equal((await f.request('import-catalog', { method: 'POST', body: { ownerToken: f.owner, ...await asset('app.js', 'x'.repeat(CATALOGUE_RESOURCE_LIMIT)) } })).status, 413);
  assert.equal(f.calls.length, 0);
});
test('immutable identical retries are safe; conflicting replacement is rejected', async () => {
  const f = await fixture(), value = await asset();
  assert.equal((await f.request('import-catalog', { method: 'POST', body: { ownerToken: f.owner, ...value } })).status, 200);
  const retry = await f.request('import-catalog', { method: 'POST', body: { ownerToken: f.owner, ...value } }); assert.equal((await retry.json()).stored, false);
  assert.equal((await f.request('import-catalog', { method: 'POST', body: { ownerToken: f.owner, ...await asset('index.html', 'changed') } })).status, 409);
  assert.equal(f.resources.get('index.html').body, value.body);
});
test('HTML401 provides account path, while no unauthorized data or lookup leaks', async () => {
  const f = await fixture(); await f.fill();
  for (const route of ['map/components', 'map/components/view']) { const r = await f.request(route); assert.equal(r.status, 401); assert.match(r.headers.get('content-type'), /^text\/html/); const body = await r.text(); assert.match(body, /href="\/konto"/); assert.doesNotMatch(body, /synthetic-index|gzip-base64|C:\\Users/); }
  assert.equal((await f.request('map/components/blocks/shk-offline-index.b64')).status, 401); assert.equal(f.calls.length, 0);
});
test('expired and wrong-account sessions cannot fetch any catalogue resource', async () => {
  const f = await fixture(), cookie = await f.unlock(); await f.fill();
  for (const s of f.sessions.values()) { s.account_user_id = 'different-user'; f.installation.owner_user_id = 'owner'; }
  assert.equal((await f.request('map/components/view', { cookie })).status, 401);
  for (const s of f.sessions.values()) { s.account_user_id = null; s.valid_until = new Date(NOW - 1).toISOString(); }
  assert.equal((await f.request('map/components/app.js', { cookie })).status, 401); assert.equal(f.calls.length, 0);
});
test('incomplete or corrupt stored version never serves partial catalogue data', async () => {
  const f = await fixture(), cookie = await f.unlock(); f.resources.set('index.html', dbRow(await asset()));
  assert.equal((await f.request('map/components/view', { cookie })).status, 503);
  await f.fill(); f.resources.get('app.js').body = 'CORRUPTED';
  const r = await f.request('map/components/app.js', { cookie }); assert.equal(r.status, 503); assert.doesNotMatch(await r.text(), /CORRUPTED|source_sha256/);
});
test('complete resources retain exact bytes, restrictive CSP, no-store and HEAD behavior', async () => {
  const f = await fixture(), cookie = await f.unlock(); await f.fill();
  for (const path of CATALOGUE_FILES) {
    const route = path === 'index.html' ? 'map/components/view' : 'map/components/' + path;
    const r = await f.request(route, { cookie }); assert.equal(r.status, 200); assert.equal(await r.text(), f.resources.get(path).body);
    assert.equal(r.headers.get('cache-control'), 'no-store'); assert.equal(r.headers.get('x-frame-options'), 'DENY'); assert.equal(r.headers.get('referrer-policy'), 'no-referrer');
    assert.match(r.headers.get('content-security-policy'), /script-src 'self';/); assert.doesNotMatch(r.headers.get('content-security-policy'), /unsafe-eval|script-src[^;]*unsafe-inline/);
  }
  const head = await f.request('map/components/view', { cookie, method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), ''); assert.ok(Number(head.headers.get('content-length')) > 0);
});
test('unknown files, mutation and extra or repeated query input never reach asset lookup', async () => {
  const f = await fixture(), cookie = await f.unlock(); await f.fill();
  for (const route of ['map/components/unknown.js', 'map/components/blocks/shk-shard-42.b64', 'map/components/view&file=secret', 'map/components/view&route=map/data']) assert.ok([400, 404].includes((await f.request(route, { cookie })).status));
  assert.equal((await f.request('map/components/view', { cookie, method: 'POST', body: {} })).status, 405); assert.equal(f.calls.length, 0);
});
test('cloud gateway allows only fixed catalogue resources and preserves private bytes and CSP', async () => {
  const calls = [], payload = 'QQ/map/private+payload==';
  const proxy = createCloudProxy({ endpoint: 'https://synthetic.supabase.co/functions/v1/assistance', fetchImpl: async (url, options) => { calls.push({ url, options }); return new Response(payload, { headers: { 'content-type': 'text/plain; charset=utf-8', 'content-security-policy': "default-src 'none'; connect-src 'self'" } }); } });
  const req = (route, method = 'GET') => Object.assign(Readable.from([]), { url: '/assistenz/components/blocks/shk-shard-0.b64', method, headers: { cookie: '__Secure-werktag-assistance=allowed; unrelated=blocked', authorization: 'Basic should-not-leave' } });
  const response = () => ({ headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(body) { this.body = body?.toString() ?? ''; } });
  const res = response(); await proxy(req(), res, 'map/components/blocks/shk-shard-0.b64'); assert.equal(res.statusCode, 200); assert.equal(res.body, payload); assert.equal(res.headers['content-security-policy'], "default-src 'none'; connect-src 'self'"); assert.equal(calls[0].options.headers.authorization, undefined); assert.equal(calls[0].options.headers.cookie, '__Secure-werktag-assistance=allowed');
  for (const route of ['map/components/blocks/shk-shard-42.b64', 'map/components/index.html', 'map/components/config.json']) { const r = response(); await proxy(req(), r, route); assert.equal(r.statusCode, 405); }
  const denied = response(); await proxy(req('', 'POST'), denied, 'map/components/view'); assert.equal(denied.statusCode, 405); assert.equal(calls.length, 1);
});
