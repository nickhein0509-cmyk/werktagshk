import { HEALTH_METRICS, HEALTH_SOURCE, parseFreddyHealthSnapshot, validHealthDate } from './health-parser.mjs';

export const FREDDY_ORIGIN = 'https://freddy.coach';
const merged = 'Merged (HealthKit daily statistics)';
const fail = code => { throw Object.assign(new Error(code), { code }); };
const iso = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const appleHealth = value => typeof value === 'string' && value.toUpperCase().replace(/-/g, '_') === 'APPLE_HEALTH';
export const validApiKey = value => typeof value === 'string' && value.startsWith('fk_live_') && value.length >= 24 && value.length <= 512 && !/[\s\x00-\x1f\x7f]/.test(value);

async function jsonResponse(response) {
  if (response.status === 401 || response.status === 403) fail('HEALTH_KEY_INVALID');
  if (response.status === 429) fail('HEALTH_SOURCE_RATE_LIMITED');
  if (!response.ok) fail('HEALTH_SOURCE_UNAVAILABLE');
  // A provider error body must never become a public error or a diagnostic log.
  if (Number(response.headers.get('content-length')) > 3 * 1024 * 1024) fail('HEALTH_SOURCE_TOO_LARGE');
  const text = await response.text();
  if (text.length > 3 * 1024 * 1024) fail('HEALTH_SOURCE_TOO_LARGE');
  try { return JSON.parse(text); } catch { fail('HEALTH_SOURCE_FORMAT'); }
}

function rowsFrom(value, keys) {
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return null;
}

export function sourceMetadata(value) {
  const rows = rowsFrom(value, ['data', 'sources']);
  if (!rows) fail('HEALTH_SOURCE_FORMAT');
  const source = rows.find(row => appleHealth(row?.provider));
  if (!source || !['connected', 'active'].includes(String(source.status ?? '').toLowerCase()) || source.needsReauth === true || source.needs_reauth === true) fail('HEALTH_SOURCE_NOT_CONNECTED');
  return {
    sourceLastSyncAt: iso(source.lastSyncAt ?? source.last_sync_at),
    sourceLastDataAt: iso(source.lastDataAt ?? source.last_data_at),
  };
}

export function catalogMetrics(value) {
  if (!value || typeof value !== 'object') fail('HEALTH_SOURCE_FORMAT');
  const found = new Set();
  let visited = 0;
  function walk(node, depth = 0) {
    if (++visited > 20000 || depth > 12) fail('HEALTH_SOURCE_FORMAT');
    if (typeof node === 'string') { if (Object.hasOwn(HEALTH_METRICS, node)) found.add(node); return; }
    if (Array.isArray(node)) { for (const item of node) walk(item, depth + 1); return; }
    if (node && typeof node === 'object') for (const [key, item] of Object.entries(node)) {
      if (Object.hasOwn(HEALTH_METRICS, key)) found.add(key);
      walk(item, depth + 1);
    }
  }
  walk(value);
  return [...found].sort();
}

export function freddyClient(apiKey, fetcher = fetch) {
  if (!validApiKey(apiKey)) fail('HEALTH_KEY_INVALID');
  const request = async (pathname, params) => {
    const url = new URL(pathname, FREDDY_ORIGIN);
    for (const [name, value] of Object.entries(params ?? {})) if (value !== null) url.searchParams.set(name, value);
    let response;
    try {
      response = await fetcher(url, { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(20000) });
    } catch { fail('HEALTH_SOURCE_UNAVAILABLE'); }
    return jsonResponse(response);
  };
  return {
    async check() {
      const sources = await request('/api/v1/sources');
      const source = sourceMetadata(sources);
      const catalog = await request('/api/v1/catalog');
      const metrics = catalogMetrics(catalog);
      // Meta describes the provider's accessible history, not deleted local data.
      const meta = catalog?.meta ?? sources?.meta;
      const historyWindowDays = Number.isSafeInteger(meta?.history_window_days) && meta.history_window_days > 0 ? meta.history_window_days : null;
      const historyFloor = validHealthDate(meta?.history_floor) ? meta.history_floor : null;
      return { ...source, metrics, historyWindowDays, historyFloor };
    },
    async snapshot({ fetchedAt = new Date().toISOString(), days = 7 } = {}) {
      const checked = await this.check();
      if (!checked.metrics.length) return { days: [], ...checked, fetchedAt };
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(fetchedAt));
      const from = new Date(Date.parse(today + 'T12:00:00Z') - (days - 1) * 86400000).toISOString().slice(0, 10);
      const rows = [], cursors = new Set();
      let cursor = null;
      for (let page = 0; page < 50; page++) {
        const result = await request('/api/v1/metrics', { provider: 'APPLE_HEALTH', metric: checked.metrics.join(','), from, to: today, limit: '1000', include_raw: 'false', cursor });
        if (!result || !Array.isArray(result.data) || !Object.hasOwn(result, 'next_cursor') || (result.next_cursor !== null && typeof result.next_cursor !== 'string')) fail('HEALTH_SOURCE_FORMAT');
        rows.push(...result.data);
        if (rows.length > 10000) fail('HEALTH_SOURCE_TOO_LARGE');
        cursor = result.next_cursor;
        if (cursor === null) return { days: normalizeRows(rows, { fetchedAt, ...checked, from, to: today }), ...checked, fetchedAt };
        if (!cursor || cursors.has(cursor)) fail('HEALTH_SOURCE_PAGINATION');
        cursors.add(cursor);
      }
      fail('HEALTH_SOURCE_PAGINATION');
    },
  };
}

export function normalizeRows(rows, { fetchedAt, sourceLastSyncAt = null, sourceLastDataAt = null, from, to }) {
  const groups = new Map();
  for (const row of rows) {
    if (!row || !appleHealth(row.provider) || !Object.hasOwn(HEALTH_METRICS, row.metric)) fail('HEALTH_SOURCE_FORMAT');
    if (!validHealthDate(row.date) || (from && row.date < from) || (to && row.date > to)) fail('HEALTH_SOURCE_FORMAT');
    if (!Number.isFinite(row.numValue) || row.numValue < 0 || row.unit !== HEALTH_METRICS[row.metric]) fail('HEALTH_SOURCE_FORMAT');
    const isMerged = [row.device, row.deviceLabel].some(value => value === 'Merged' || value === merged);
    if ((row.metric.endsWith('_total') || row.metric.includes('_merged_')) && !isMerged) fail('HEALTH_NON_MERGED_RECORD');
    const device = isMerged ? merged : row.deviceLabel ?? row.device;
    if (typeof device !== 'string' || !device || device.length > 256 || /[\r\n\0]/.test(device)) fail('HEALTH_SOURCE_FORMAT');
    let observation = '';
    if (row.metric === 'vo2_max') {
      const at = iso(row.timestamp);
      if (!at) fail('HEALTH_OBSERVATION_TIME_REQUIRED');
      // ISO normalization adds .000 even when the source only reports seconds.
      const time = at.slice(0, -1);
      const hasFraction = /\.\d+(?:Z|[+-]\d{2}:\d{2})$/i.test(row.timestamp);
      observation = ' @ ' + (hasFraction ? time : time.replace(/\.000$/, '')) + ' UTC+00:00';
    }
    if (!groups.has(row.date)) groups.set(row.date, []);
    groups.get(row.date).push(`  ${row.metric}: ${row.numValue} ${row.unit}${observation} (Apple Health · ${device})`);
  }
  const queryText = groups.size ? 'Health data:\n' + [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([day, lines]) => day + ':\n' + lines.join('\n')).join('\n') : 'No health data';
  // Use the established parser rather than independently interpreting totals or VO2 observations.
  const parsed = parseFreddyHealthSnapshot({ schemaVersion: 1, provider: 'APPLE_HEALTH', timezone: 'Europe/Berlin', fetchedAt, sourceLastSyncAt, sourceLastDataAt, queryText });
  return [...parsed.days].map(([date, metrics]) => ({ schemaVersion: 1, date, source: HEALTH_SOURCE, provider: 'APPLE_HEALTH', timezone: 'Europe/Berlin', fetchedAt: parsed.fetchedAt, sourceLastSyncAt: parsed.sourceLastSyncAt, sourceLastDataAt: parsed.sourceLastDataAt, metrics }));
}
