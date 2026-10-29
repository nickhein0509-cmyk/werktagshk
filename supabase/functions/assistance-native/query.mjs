export const MAX_JOURNEY_POINTS = 10000;
export const MAX_NATIVE_RESPONSE_BYTES = 4 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = (status, message) => { throw Object.assign(new Error(message), {status}); };

export function nativeQuery(url, method, {allowConfig = false} = {}) {
  const action = url.searchParams.get('action');
  const expected = {status: 'GET', health: 'GET', journey: 'GET', ingest: 'POST', ...(allowConfig ? {config: 'GET'} : {})}[action];
  if (!expected || method !== expected) fail(405, 'Anfrage nicht unterstützt.');
  const allowed = action === 'journey' ? ['action', 'date', 'deviceId'] : ['action'];
  if (url.searchParams.getAll('action').length !== 1 || [...url.searchParams.keys()].some(key => !allowed.includes(key) || url.searchParams.getAll(key).length !== 1)) {
    fail(400, 'Ungültige Anfrage.');
  }
  if (action !== 'journey') return {action};
  const date = url.searchParams.get('date'), deviceId = url.searchParams.get('deviceId');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || !uuid.test(deviceId ?? '')) {
    fail(400, 'Gültiges Datum und Gerät erforderlich.');
  }
  return {action, date, deviceId: deviceId.toLowerCase()};
}
