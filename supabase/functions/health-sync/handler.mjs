import { connectionFromBody, healthConnectionClient } from './connection.mjs';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const safeCodes = new Set(['HEALTH_KEY_INVALID', 'HEALTH_CONSENT_REQUIRED', 'HEALTH_SOURCE_NOT_CONNECTED', 'HEALTH_SOURCE_RATE_LIMITED', 'HEALTH_SOURCE_UNAVAILABLE', 'HEALTH_SOURCE_FORMAT', 'HEALTH_SOURCE_PAGINATION', 'HEALTH_SOURCE_TOO_LARGE', 'HEALTH_NON_MERGED_RECORD', 'HEALTH_INCOMPLETE_QUERY', 'HEALTH_AMBIGUOUS_DUPLICATE', 'HEALTH_AMBIGUOUS_OBSERVATION', 'HEALTH_OBSERVATION_TIME_REQUIRED']);
const response = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' } });
const fail = code => { throw Object.assign(new Error(code), { code }); };
const safeError = error => safeCodes.has(error?.code) ? error.code : 'HEALTH_SYNC_FAILED';

export function createHealthSyncHandler({ supabaseUrl, serviceKey, publicOrigin = 'https://werk-tag.com', fetcher = fetch, now = () => new Date().toISOString() }) {
  const base = supabaseUrl.replace(/\/$/, '');
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
  async function db(path, body, method = 'POST') {
    const result = await fetcher(base + '/rest/v1/' + path, { method, headers, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000) });
    if (!result.ok) fail('HEALTH_DATABASE_UNAVAILABLE');
    const text = await result.text();
    return text ? JSON.parse(text) : null;
  }
  const rpc = (name, body) => db('rpc/' + name, body);
  async function owner(req) {
    const authorization = req.headers.get('Authorization') ?? '';
    if (!/^Bearer [^\s]+$/.test(authorization) || authorization === headers.Authorization) return null;
    const result = await fetcher(base + '/auth/v1/user', { headers: { apikey: serviceKey, Authorization: authorization }, signal: AbortSignal.timeout(15000) });
    if (!result.ok) return null;
    const user = await result.json();
    if (!uuid(user.id) || user.is_anonymous === true) return null;
    const installations = await db('assistance_installations?select=id&owner_user_id=eq.' + encodeURIComponent(user.id) + '&limit=2', null, 'GET');
    // A user with several installations must explicitly select one; do not silently reassign health history.
    const selected = new URL(req.url).searchParams.get('installationId');
    if (selected) return uuid(selected) && installations.some(row => row.id === selected) ? selected : null;
    return installations.length === 1 ? installations[0].id : null;
  }
  async function syncOne(installationId) {
    const claim = await rpc('assistance_health_claim', { p_installation_id: installationId });
    if (!claim?.claimed) return { skipped: true };
    try {
      const snapshot = await healthConnectionClient(claim.apiKey, fetcher).snapshot({ fetchedAt: now() });
      const committed = await rpc('assistance_health_commit_sync', { p_installation_id: installationId, p_lease_token: claim.leaseToken, p_days: snapshot.days, p_source_last_sync_at: snapshot.sourceLastSyncAt, p_source_last_data_at: snapshot.sourceLastDataAt });
      return committed?.committed === true ? { ok: true } : { skipped: true };
    } catch (error) {
      const code = safeError(error);
      await rpc('assistance_health_fail_sync', { p_installation_id: installationId, p_lease_token: claim.leaseToken, p_error_code: code });
      return { ok: false, error: code };
    }
  }
  return async req => {
    try {
      if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base) || !serviceKey) return response(503, { ok: false, error: 'HEALTH_NOT_AVAILABLE' });
      const url = new URL(req.url), route = url.searchParams.get('route') ?? 'status';
      if ([...url.searchParams.keys()].some(key => !['route', 'installationId'].includes(key)) || url.searchParams.getAll('route').length > 1 || url.searchParams.getAll('installationId').length > 1) return response(400, { ok: false, error: 'HEALTH_INVALID_REQUEST' });
      if (route === 'sync') {
        if (req.method !== 'POST') return response(405, { ok: false, error: 'HEALTH_METHOD_NOT_ALLOWED' });
        const secret = req.headers.get('x-health-cron-secret') ?? '';
        if (secret.length < 32 || secret.length > 256 || !(await rpc('assistance_health_authorize_cron', { p_secret: secret }))) return response(401, { ok: false, error: 'HEALTH_UNAUTHORIZED' });
        const installations = await db('assistance_health_sync?select=installation_id&enabled=eq.true&limit=25', null, 'GET');
        let completed = 0, failed = 0;
        for (const installation of installations) { const result = await syncOne(installation.installation_id); if (result.ok) completed++; else if (result.ok === false) failed++; }
        return response(failed ? 503 : 200, { ok: failed === 0, completed, failed });
      }
      if (!['status', 'configure', 'disable', 'check', 'refresh'].includes(route)) return response(404, { ok: false, error: 'HEALTH_NOT_FOUND' });
      if (req.method !== (route === 'status' ? 'GET' : 'POST')) return response(405, { ok: false, error: 'HEALTH_METHOD_NOT_ALLOWED' });
      if (req.method === 'POST' && (req.headers.get('origin') !== publicOrigin || req.headers.get('sec-fetch-site') === 'cross-site')) return response(403, { ok: false, error: 'HEALTH_ORIGIN_REQUIRED' });
      const installationId = await owner(req);
      if (!installationId) return response(403, { ok: false, error: 'HEALTH_OWNER_REQUIRED' });
      if (route === 'configure' || route === 'check') {
        if (Number(req.headers.get('content-length')) > 2048) return response(413, { ok: false, error: 'HEALTH_INVALID_REQUEST' });
        const raw = await req.text();
        if (raw.length > 2048) return response(413, { ok: false, error: 'HEALTH_INVALID_REQUEST' });
        let body;
        try { body = JSON.parse(raw); } catch { return response(400, { ok: false, error: 'HEALTH_INVALID_REQUEST' }); }
        const credential = connectionFromBody(body);
        if (!credential) return response(400, { ok: false, error: 'HEALTH_KEY_INVALID' });
        const checked = await healthConnectionClient(credential, fetcher).check();
        if (route === 'check') {
          body.apiKey = null; body.mcpToken = null; body.mcpUrl = null;
          return response(200, { ok: true, sourceConnected: true, sourceLastSyncAt: checked.sourceLastSyncAt, sourceLastDataAt: checked.sourceLastDataAt, metricsAvailable: checked.metrics.length, historyWindowDays: checked.historyWindowDays, historyFloor: checked.historyFloor });
        }
        await rpc('assistance_health_configure', { p_installation_id: installationId, p_api_key: credential, p_function_url: base + '/functions/v1/health-sync?route=sync' });
        body.apiKey = null; body.mcpToken = null; body.mcpUrl = null;
        // Complete one real import before calling activation successful. Failures remain visible in status.
        await syncOne(installationId);
        return response(200, { ok: true, ...(await rpc('assistance_health_status', { p_installation_id: installationId })) });
      }
      if (route === 'refresh') {
        if (Number(req.headers.get('content-length')) > 2048) return response(413, { ok: false, error: 'HEALTH_INVALID_REQUEST' });
        const raw = await req.text();
        if (raw.length > 2048) return response(413, { ok: false, error: 'HEALTH_INVALID_REQUEST' });
        let body;
        try { body = raw.trim() ? JSON.parse(raw) : {}; } catch { return response(400, { ok: false, error: 'HEALTH_INVALID_REQUEST' }); }
        if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).length) return response(400, { ok: false, error: 'HEALTH_INVALID_REQUEST' });
        const status = await rpc('assistance_health_status', { p_installation_id: installationId });
        if (!status?.configured) return response(409, { ok: false, error: 'HEALTH_NOT_CONFIGURED' });
        if (!status.enabled) return response(409, { ok: false, error: 'HEALTH_SYNC_DISABLED' });
        const elapsed = Date.parse(now()) - Date.parse(status.lastAttemptAt);
        if (Number.isFinite(elapsed) && elapsed < 60000) return response(429, { ok: false, error: 'HEALTH_REFRESH_COOLDOWN', retryAfterSeconds: Math.max(1, Math.ceil((60000 - elapsed) / 1000)) });
        const result = await syncOne(installationId);
        const next = await rpc('assistance_health_status', { p_installation_id: installationId });
        return response(result.ok ? 200 : result.skipped ? 409 : 503, { ...next, ok: result.ok === true, ...(result.ok ? {} : { error: result.skipped ? 'HEALTH_SYNC_BUSY' : result.error }) });
      }
      if (route === 'disable') await rpc('assistance_health_disable', { p_installation_id: installationId });
      return response(200, { ok: true, ...(await rpc('assistance_health_status', { p_installation_id: installationId })) });
    } catch (error) {
      const code = safeError(error);
      return response(code === 'HEALTH_KEY_INVALID' ? 400 : 503, { ok: false, error: code });
    }
  };
}
