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

test('VO2 observations retain the precision supplied by the provider', () => {
  for (const [timestamp, observedAt, precision] of [
    ['2026-10-28T09:12:34Z', '2026-10-28T09:12:34.000Z', 'second'],
    ['2026-10-28T10:12:34+01:00', '2026-10-28T09:12:34.000Z', 'second'],
    ['2026-10-28T09:12:34.000Z', '2026-10-28T09:12:34.000Z', 'millisecond'],
  ]) {
    const [day] = normalizeRows([{ ...steps, metric: 'vo2_max', device: 'Apple Watch', numValue: 45.2, unit: 'ml/kg/min', timestamp }], { fetchedAt });
    assert.equal(day.metrics.vo2_max.observedAt, observedAt);
    assert.equal(day.metrics.vo2_max.observedAtPrecision, precision, timestamp);
  }
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

function fixture({ owner = true, anonymous = false, providerStatus = 200, cursorLoop = false, committed = true, initialConfigured = false, initialAttemptAt = null, claimAvailable = true } = {}) {
  const calls = [], stored = [];
  let configured = initialConfigured, disabled = false, lastAttemptAt = initialAttemptAt, lastSuccessAt = null, errorCode = null;
  const fetcher = async (input, options = {}) => {
    const url = new URL(input), body = options.body ? JSON.parse(options.body) : null;
    calls.push({ path: url.pathname, query: url.search, body });
    if (url.pathname === '/auth/v1/user') return options.headers.Authorization === `Bearer ${token}` ? json({ id: user, is_anonymous: anonymous }) : new Response(null, { status: 401 });
    if (url.pathname === '/rest/v1/assistance_installations') return json(owner ? [{ id: installation }] : []);
    if (url.pathname === '/rest/v1/assistance_health_sync') return json([{ installation_id: installation }]);
    if (url.pathname.endsWith('/assistance_health_authorize_cron')) return json(body.p_secret === 's'.repeat(64));
    if (url.pathname.endsWith('/assistance_health_configure')) { configured = true; return json(null); }
    if (url.pathname.endsWith('/assistance_health_disable')) { disabled = true; return json(null); }
    if (url.pathname.endsWith('/assistance_health_status')) return json({ configured, enabled: configured && !disabled, cronActive: configured && !disabled, status: disabled ? 'disabled' : errorCode ? 'error' : configured ? 'active' : 'not_configured', lastAttemptAt, lastSuccessAt, errorCode });
    if (url.pathname.endsWith('/assistance_health_claim')) { if (!claimAvailable) return json({ claimed: false }); lastAttemptAt = fetchedAt; return json({ claimed: true, apiKey, leaseToken: lease }); }
    if (url.pathname.endsWith('/assistance_health_commit_sync')) { if (committed) { stored.push(body); lastSuccessAt = fetchedAt; errorCode = null; } return json({ committed, ...(committed ? {} : { reason: 'superseded' }) }); }
    if (url.pathname.endsWith('/assistance_health_fail_sync')) { errorCode = body.p_error_code; return json(null); }
    if (url.pathname.endsWith('/sources')) return providerStatus === 200 ? json({ data: [source] }) : new Response('private-provider-error-not-to-return', { status: providerStatus });
    if (url.pathname.endsWith('/catalog')) return json({ data: [{ metric: 'steps_total' }] });
    if (url.pathname.endsWith('/metrics')) return json({ data: [steps], next_cursor: cursorLoop ? 'same' : null });
    assert.fail('Unexpected fetch ' + url.pathname);
  };
  const handler = createHealthSyncHandler({ supabaseUrl: 'https://test-project.supabase.co', serviceKey: 'server-only-test-key', fetcher, now: () => fetchedAt });
  const request = (route, body, auth = token) => handler(new Request('https://test-project.supabase.co/functions/v1/health-sync?route=' + route, {
    method: route === 'status' ? 'GET' : 'POST', headers: { Authorization: 'Bearer ' + auth, 'Content-Type': 'application/json', Origin: 'https://werk-tag.com' }, ...(body ? { body: JSON.stringify(body) } : {}),
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

test('anonymous accounts cannot read Health status or use owner actions', async () => {
  for (const route of ['status', 'check', 'configure', 'refresh', 'disable']) {
    const f = fixture({ anonymous: true, initialConfigured: true });
    const response = await f.request(route, route === 'status' ? undefined : route === 'check' || route === 'configure' ? { apiKey } : {});
    assert.equal(response.status, 403, route);
    assert.deepEqual(await response.json(), { ok: false, error: 'HEALTH_OWNER_REQUIRED' });
    assert.deepEqual(f.calls.map(call => call.path), ['/auth/v1/user']);
    assert.equal(f.stored.length, 0);
  }
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

test('checking a key returns only connection metadata and never stores or schedules it', async () => {
  const f = fixture();
  const response = await f.request('check', { apiKey }), body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body, { ok: true, sourceConnected: true, sourceLastSyncAt: '2026-10-28T11:55:00.000Z', sourceLastDataAt: '2026-10-28T11:54:00.000Z', metricsAvailable: 1, historyWindowDays: null, historyFloor: null });
  assert.equal(JSON.stringify(body).includes(apiKey), false);
  assert.equal(f.calls.some(call => /assistance_health_(configure|claim|commit|fail|disable)/.test(call.path)), false);
  assert.equal(f.calls.some(call => call.path.endsWith('/metrics')), false);
  assert.equal(f.stored.length, 0);
});

test('owner mutations reject a foreign or absent origin before reading ownership or keys', async () => {
  for (const route of ['check', 'configure', 'refresh', 'disable']) {
    for (const origin of [null, 'https://other.example.invalid']) {
      const f = fixture({ initialConfigured: true });
      const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
      if (origin) headers.Origin = origin;
      const response = await f.handler(new Request('https://test-project.supabase.co/functions/v1/health-sync?route=' + route, { method: 'POST', headers, body: JSON.stringify({ apiKey }) }));
      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), { ok: false, error: 'HEALTH_ORIGIN_REQUIRED' });
      assert.equal(f.calls.length, 0);
    }
  }
});

test('manual refresh requires an existing enabled connection and preserves its configuration', async () => {
  const missing = fixture();
  const absent = await missing.request('refresh', {});
  assert.equal(absent.status, 409);
  assert.equal((await absent.json()).error, 'HEALTH_NOT_CONFIGURED');
  assert.equal(missing.calls.some(call => call.path.endsWith('/assistance_health_claim')), false);

  const f = fixture({ initialConfigured: true });
  const response = await f.request('refresh', {}), body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.lastSuccessAt, fetchedAt);
  assert.equal(f.stored.length, 1);
  assert.equal(JSON.stringify(body).includes(apiKey), false);
  assert.equal(f.calls.some(call => /assistance_health_(configure|disable)/.test(call.path)), false);
  await f.request('disable', {});
  const paused = await f.request('refresh', {});
  assert.equal(paused.status, 409);
  assert.equal((await paused.json()).error, 'HEALTH_SYNC_DISABLED');
  assert.equal(f.stored.length, 1);
});

test('manual refresh respects recent attempts and concurrent leases without extra provider calls', async () => {
  const cooldown = fixture({ initialConfigured: true, initialAttemptAt: '2026-10-28T11:59:45.000Z' });
  const recent = await cooldown.request('refresh', {});
  assert.equal(recent.status, 429);
  assert.deepEqual(await recent.json(), { ok: false, error: 'HEALTH_REFRESH_COOLDOWN', retryAfterSeconds: 45 });
  assert.equal(cooldown.calls.some(call => call.path.endsWith('/assistance_health_claim')), false);

  const leased = fixture({ initialConfigured: true, claimAvailable: false });
  const busy = await leased.request('refresh', {});
  assert.equal(busy.status, 409);
  assert.equal((await busy.json()).error, 'HEALTH_SYNC_BUSY');
  assert.equal(leased.calls.some(call => call.path.startsWith('/api/v1/')), false);
});

test('manual refresh surfaces a typed provider failure and never returns provider bodies', async () => {
  const f = fixture({ initialConfigured: true, providerStatus: 429 });
  const response = await f.request('refresh', {}), body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.error, 'HEALTH_SOURCE_RATE_LIMITED');
  assert.equal(body.errorCode, 'HEALTH_SOURCE_RATE_LIMITED');
  assert.equal(body.lastSuccessAt, null);
  assert.equal(f.stored.length, 0);
  assert.equal(JSON.stringify(body).includes('private-provider-error'), false);
  assert.equal(JSON.stringify(body).includes(apiKey), false);
});

test('manual refresh accepts no replacement key or arbitrary request properties', async () => {
  const f = fixture({ initialConfigured: true });
  const response = await f.request('refresh', { apiKey });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'HEALTH_INVALID_REQUEST');
  assert.equal(f.calls.some(call => call.path.endsWith('/assistance_health_claim')), false);
});

test('check reports documented history bounds and source provider casing is normalized', async () => {
  const client = freddyClient(apiKey, async url => String(url).endsWith('/sources')
    ? json({ data: [{ ...source, provider: 'apple-health' }] })
    : json({ data: [{ metric: 'steps_total' }], meta: { history_window_days: 7, history_floor: '2026-10-22' } }));
  const checked = await client.check();
  assert.equal(checked.historyWindowDays, 7);
  assert.equal(checked.historyFloor, '2026-10-22');
  assert.deepEqual(checked.metrics, ['steps_total']);
  assert.equal(normalizeRows([{ ...steps, provider: 'apple_health' }], { fetchedAt })[0].provider, 'APPLE_HEALTH');
});
