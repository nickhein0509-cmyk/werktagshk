// Recorder identity is provenance, not a duplicate event. Never concatenate two
// devices into one measured journey or add their distances together.
const fail = (status, message) => { throw Object.assign(new Error(message), { status, statusCode: status }); };
const valid = (source, device) => typeof source === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(source) &&
  typeof device === 'string' && device.length > 0 && device.length <= 256 && !/[\r\n\0]/.test(device);

export function validateRecorderSelection(value = {}) {
  const { source, device } = value;
  if (source === undefined && device === undefined) return null;
  if (!valid(source, device) || /[\u0000-\u001f\u007f]/.test(device)) fail(400, 'Aufzeichnungsquelle und Gerät müssen gemeinsam gültig angegeben werden.');
  return { source, device };
}

export function recorderKey(point) {
  // Old fixtures/imported records without either field stay their own group.
  // Do not invent a source name or merge them into a labelled device.
  if (point.source === undefined && point.device === undefined) return 'legacy';
  if (!valid(point.source, point.device)) fail(503, 'Ungültige Aufzeichnungsquelle.');
  return JSON.stringify([point.source, point.device]);
}

export const recorderCount = rows => new Set(rows.map(recorderKey)).size;

export function selectRecorder(rows, withinPeriod = () => true, options = {}) {
  const requested = validateRecorderSelection(options), known = new Set(), groups = new Map();
  for (const point of rows) {
    const key = recorderKey(point); known.add(key);
    if (!withinPeriod(point)) continue;
    let group = groups.get(key);
    if (!group) {
      group = { key, source: point.source, device: point.device, pointCount: 0, latestTimestamp: point.tst };
      groups.set(key, group);
    }
    group.pointCount++;
    group.latestTimestamp = Math.max(group.latestTimestamp, point.tst);
  }
  // Stable for shuffled input and delayed uploads: source time, then identity.
  const available = [...groups.values()].sort((a, b) => b.latestTimestamp - a.latestTimestamp || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const selectedKey = requested ? recorderKey(requested) : available[0]?.key ?? null;
  if (requested && !known.has(selectedKey)) fail(404, 'Die gewählte Aufzeichnungsquelle ist nicht vorhanden.');
  const selected = requested ?? available[0];
  return {
    rows: selectedKey === null ? [] : rows.filter(point => recorderKey(point) === selectedKey),
    recorders: available.filter(group => group.key !== 'legacy').map(({ source, device, pointCount, latestTimestamp }) => ({ source, device, pointCount, latestTimestamp })),
    selectedRecorder: selectedKey === null || selectedKey === 'legacy' ? null : { source: selected.source, device: selected.device },
    selectedKey,
    recorderCount: groups.size,
  };
}
