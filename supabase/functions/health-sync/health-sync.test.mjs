import test from 'node:test';
import assert from 'node:assert/strict';
import { freddyClient, normalizeRows, sourceMetadata } from './freddy.mjs';
import { createHealthSyncHandler } from './handler.mjs';

const installation = '11111111-1111-4111-8111-111111111111';
const user = '22222222-2222-4222-8222-222222222222';
const token = 'test-user-token';
const apiKey = 'fk_live_' + 'test'.repeat(12);
const lease = '33333333-3333-4333-8333-333333333333';
const fetchedAt = '2026-10-28T12:00:00.000Z';
const source = { provider: 'APPLE_HEALTH', status: 'connected', lastSyncAt: '2026-10-28T11:55:00Z', lastDataAt: '2026-10-28T11:54:00Z' };
const steps = { provider: 'APPLE_HEALTH', date: '2026-10-28', timestamp: '2026-10-28T11:54:00Z', metric: 'steps_total', device: 'Merged', numValue: 1234, unit: 'count' };
const json = data => Response.json(data);

test('existing parser preserves merged totals, source times and exact VO2 observation time', () => {
  const days = normalizeRows([steps, { ...steps, metric: 'vo2_max', device: 'Apple Watch', numValue: 45.2, unit: 'ml/kg/min', timestamp: '2026-10-28T09:12:34.567Z' }], { fetchedAt, sourceLastSyncAt: source.lastSyncAt });
  assert.equal(days[0].metrics.steps_total.value, 1234);
  assert.equal(days[0].metrics.steps_total.sourceDevice, 'Merged (HealthKit daily statistics)');
  assert.equal(days[0].metrics.vo2_max.observedAt, '2026-10-28T09:12:34.567Z');
  assert.equal(days[0].metrics.vo2_max.observedAtPrecision, 'millisecond');
  assert.equal(days[0].sourceLastSyncAt, '2026-10-28T11:55:00.000Z');
});

test('per-device totals, contradictory duplicates and out-of-window rows fail closed', () => {
  assert.throws(() => normalizeRows([{ ...steps, device: 'iPhone' }], { fetchedAt }), /HEALTH_NON_MERGED_RECORD/);
  assert.throws(() => normalizeRows([steps, { ...steps, numValue: 2345 }], { fetchedAt }), /HEALTH_AMBIGUOUS_DUPLICATE/);
  assert.throws(() => normalizeRows([steps], { fetchedAt, from: '2026-10-29' }), /HEALTH_SOURCE_FORMAT/);
  assert.deepEqual(normalizeRows([], { fetchedAt }), []);
});

test('full pagination is mandatory and repeated cursors never create a partial snapshot', async () => {
  const seen = [];
  const client = freddyClient(apiKey, async url => {
    const path = new URL(url).pathname; seen.push(String(url));
    if (path.endsWith('/sources')) return json({ sources: [source] });
    if (path.endsWith('/catalog')) return json({ metrics: [{ metric: 'steps_total' }] });
    if (!new URL(url).searchParams.has('cursor')) return json({ data: [steps], next_cursor: 'second' });
    return json({ data: [{ ...steps, date: '2026-10-27' }], next_cursor: null });
  });
  assert.equal((await client.snapshot({ fetchedAt })).days.length, 2);
  assert.equal(seen.filter(url => url.includes('/metrics?')).length, 2);
  const bad = freddyClient(apiKey, async url => String(url).includes('/sources') ? json([source]) : String(url).includes('/catalog') ? json(['steps_total']) : json({ data: [steps], next_cursor: 'same' }));
  await assert.rejects(bad.snapshot({ fetchedAt }), /HEALTH_SOURCE_PAGINATION/);
});

test('source connection is validated without requesting or returning raw health payloads', () => {
  assert.deepEqual(sourceMetadata({ data: [source] }), { sourceLastSyncAt: '2026-10-28T11:55:00.000Z', sourceLastDataAt: '2026-10-28T11:54:00.000Z' });
  assert.throws(() => sourceMetadata({ sources: [{ ...source, needsReauth: true }] }), /HEALTH_SOURCE_NOT_CONNECTED/);
});

function fixture({ owner = true, providerStatus = 200, cursorLoop = false, committed = true } = {}) {
  const calls = [], stored = [];
  let configured = false, disabled = false;
  const fetcher = async (input, options = {}) => {
    const url = new URL(input), body = options.body ? JSON.parse(options.body) : null;
    calls.push({ path: url.pathname, query: url.search, body });
    if (url.pathname === '/auth/v1/user') return options.headers.Authorization === `Bearer ${token}` ? json({ id: user }) : json({ error: 'unauthorized' }, { status: 401 });
    if (url.pathname === '/rest/v1/assistance_installations') return json(owner ? [{ id: installation }] : []);
    if (url.pathname === '/rest/v1/assistance_health_sync') return json([{ installation_id: installation }]);
    if (url.pathname.endsWith('/assistance_health_authorize_cron')) return json(body.p_secret === 's'.repeat(64));
    if (url.pathname.endsWith('/assistance_health_configure')) { configured = true; return json(null); }
    if (url.pathname.endsWith('/assistance_health_disable')) { disabled = true; return json(null); }
    if (url.pathname.endsWith('/assistance_health_status')) return json({ configured, enabled: configured && !disabled, cronActive: configured && !disabled, status: disabled ? 'disabled' : configured ? 'active' : 'not_configured' });
    if (url.pathname.endsWith('/assistance_health_claim')) return json({ claimed: true, apiKey, leaseToken: lease });
    if (url.pathname.endsWith('/assistance_health_commit_sync')) { if (committed) stored.push(body); return json({ committed, ...(committed ? {} : { reason: 'superseded' }) }); }
    if (url.pathname.endsWith('/assistance_health_fail_sync')) return json(null);
    if (url.pathname.endsWith('/sources')) return providerStatus === 200 ? json({ data: [source] }) : new Response('private-provider-error-not-to-return', { status: providerStatus });
    if (url.pathname.endsWith('/catalog')) return json({ data: [{ metric: 'steps_total' }] });
    if (url.pathname.endsWith('/metrics')) return json({ data: [steps], next_cursor: cursorLoop ? 'same' : null });
    assert.fail('Unexpected fetch ' + url.pathname);
  };
  const handler = createHealthSyncHandler({ supabaseUrl: 'https://test-project.supabase.co', serviceKey: 'server-only-test-key', fetcher, now: () => fetchedAt });
  const request = (route, body, auth = token) => handler(new Request('https://test-project.supabase.co/functions/v1/health-sync?route=' + route, {
    method: route === 'status' ? 'GET' : 'POST', headers: { Authorization: 'Bearer ' + auth, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
  }));
  return { handler, request, calls, stored };
}

test('owner-only configuration verifies the key before storage and completes a real first import', async () => {
  const f = fixture();
  const result = await f.request('configure', { apiKey }), body = await result.json();
  assert.equal(result.status, 200); assert.equal(body.enabled, true); assert.equal(body.cronActive, true);
  assert.equal(f.stored.length, 1); assert.equal(f.stored[0].p_days[0].metrics.steps_total.value, 1234);
  assert.equal(JSON.stringify(body).includes(apiKey), false);
  assert.ok(f.calls.findIndex(call => call.path.endsWith('/sources')) < f.calls.findIndex(call => call.path.endsWith('/assistance_health_configure')));
  assert.equal(f.calls.some(call => call.query.includes('include_raw=true')), false);
});

test('wrong owner cannot probe a key; provider authentication errors leave configuration untouched', async () => {
  const wrong = fixture({ owner: false });
  assert.equal((await wrong.request('configure', { apiKey })).status, 403);
  assert.equal(wrong.calls.some(call => call.path.includes('/api/v1/')), false);
  const invalid = fixture({ providerStatus: 401 });
  const response = await invalid.request('configure', { apiKey });
  assert.equal(response.status, 400); assert.deepEqual(await response.json(), { ok: false, error: 'HEALTH_KEY_INVALID' });
  assert.equal(invalid.calls.some(call => call.path.endsWith('/assistance_health_configure')), false);
});

test('cron secret is checked before credentials; failed pagination never commits partial data', async () => {
  const f = fixture({ cursorLoop: true });
  assert.equal((await f.handler(new Request('https://test-project.supabase.co/functions/v1/health-sync?route=sync', { method: 'POST' }))).status, 401);
  assert.equal(f.calls.length, 0);
  const response = await f.handler(new Request('https://test-project.supabase.co/functions/v1/health-sync?route=sync', { method: 'POST', headers: { 'x-health-cron-secret': 's'.repeat(64) } }));
  assert.equal(response.status, 503); assert.equal(f.stored.length, 0);
  assert.equal(f.calls.find(call => call.path.endsWith('/assistance_health_fail_sync')).body.p_error_code, 'HEALTH_SOURCE_PAGINATION');
});

test('disable only pauses scheduling and does not delete existing Health data', async () => {
  const f = fixture();
  await f.request('configure', { apiKey });
  const response = await f.request('disable', {}), body = await response.json();
  assert.equal(body.status, 'disabled'); assert.equal(f.stored.length, 1);
  assert.equal(f.calls.some(call => /delete/i.test(call.path)), false);
});

test('a disabled or replaced lease is skipped rather than counted as a successful import', async () => {
  const f = fixture({ committed: false });
  const response = await f.handler(new Request('https://test-project.supabase.co/functions/v1/health-sync?route=sync', { method: 'POST', headers: { 'x-health-cron-secret': 's'.repeat(64) } }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, completed: 0, failed: 0 });
  assert.equal(f.stored.length, 0);
});
