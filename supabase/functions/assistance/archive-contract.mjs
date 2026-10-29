import { buildJournal, clipJournal, dayOf } from './semantics/journal.js';
import { recorderKey } from './semantics/recorders.js';

const compareKeys = (left, right) => left < right ? -1 : left > right ? 1 : 0;
export const compareArchivePoints = (left, right) => left.tst - right.tst || Date.parse(left.receivedAt) - Date.parse(right.receivedAt) || compareKeys(left.id, right.id);
const canonicalValue = value => Array.isArray(value)
  ? value.map(canonicalValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalValue(value[key])]))
    : value;
const same = (left, right) => JSON.stringify(canonicalValue(left)) === JSON.stringify(canonicalValue(right));
const fail = () => { const error = new Error('Ungültiges Archiv.'); error.status = 400; error.statusCode = 400; throw error; };

function validateJournal(journal, points) {
  if (!journal || !Array.isArray(journal.trips) || !Array.isArray(journal.stays) || !journal.settings) fail();
  for (const kind of ['trips', 'stays']) for (const entry of journal[kind]) {
    if (!entry || !Number.isSafeInteger(entry.startIndex) || !Number.isSafeInteger(entry.endIndex) || entry.startIndex < 0 || entry.endIndex < entry.startIndex || entry.endIndex >= points.length ||
      !Number.isFinite(entry.durationSeconds) || entry.durationSeconds < 0 || entry.startTimestamp !== points[entry.startIndex].tst || entry.endTimestamp !== points[entry.endIndex].tst || entry.durationSeconds !== entry.endTimestamp - entry.startTimestamp) fail();
  }
}

export function archiveRecorderJournals(rows, date, { allowLegacy = false } = {}) {
  const groups = new Map();
  for (const point of rows) {
    const key = recorderKey(point);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(point);
  }
  const journals = [];
  for (const [key, group] of [...groups].sort(([left], [right]) => compareKeys(left, right))) {
    const ordered = [...group].sort(compareArchivePoints);
    const startIndex = ordered.findIndex(point => dayOf(point.tst) === date);
    if (startIndex < 0) continue;
    let endIndex = startIndex;
    while (endIndex + 1 < ordered.length && dayOf(ordered[endIndex + 1].tst) === date) endIndex++;
    const points = ordered.slice(startIndex, endIndex + 1);
    const journal = clipJournal(buildJournal(ordered), ordered, startIndex, endIndex);
    const { source, device } = points[0],value={
      source, device, pointCount: points.length, tripCount: journal.trips.length, stayCount: journal.stays.length,
      firstTimestamp: points[0].tst, lastTimestamp: points.at(-1).tst,
      pointIds: points.map(point => point.id), journal,
    };
    // v2 cannot identify a legacy recorder. Context resolution may still use
    // its journal as an ambiguity marker so exact labelled references work.
    if (key === 'legacy') {
      if (!allowLegacy) fail();
      journals.push({ ...value, legacy: true }); continue;
    }
    journals.push(value);
    if (recorderKey({ source, device }) !== key) fail();
  }
  return journals;
}

export function archiveV2Content(rows, date) {
  const points = rows.filter(point => dayOf(point.tst) === date).sort(compareArchivePoints);
  const journals = archiveRecorderJournals(rows, date);
  return { points, journals };
}

export function archiveHashInput(payload) {
  return payload?.schemaVersion === 2 ? { points: payload.points, journals: payload.journals } : { points: payload?.points, journal: payload?.journal };
}

export function validateArchiveStructure(payload, date) {
  if (!payload || payload.date !== date || payload.timeZone !== 'Europe/Berlin' || !Number.isSafeInteger(payload.revision) || payload.revision < 1 || !Array.isArray(payload.points)) fail();
  if (payload.schemaVersion === 1) {
    validateJournal(payload.journal, payload.points);
    return payload;
  }
  if (payload.schemaVersion !== 2 || !Array.isArray(payload.journals) || !payload.journals.length || payload.recorderCount !== payload.journals.length || payload.pointCount !== payload.points.length) fail();
  const ids = new Map();
  for (let index = 0; index < payload.points.length; index++) {
    const point = payload.points[index];
    if (!point || typeof point.id !== 'string' || ids.has(point.id) || dayOf(point.tst) !== date || (index > 0 && compareArchivePoints(payload.points[index - 1], point) > 0)) fail();
    recorderKey(point); ids.set(point.id, point);
  }
  const assigned = new Set(), keys = new Set();
  let tripCount = 0, stayCount = 0;
  for (let index = 0; index < payload.journals.length; index++) {
    const value = payload.journals[index], key = recorderKey(value);
    if (key === 'legacy' || keys.has(key) || (index > 0 && compareKeys([...keys].at(-1), key) >= 0) || !Array.isArray(value.pointIds) || !value.pointIds.length || value.pointCount !== value.pointIds.length) fail();
    keys.add(key);
    const points = value.pointIds.map(id => {
      const point = ids.get(id);
      if (!point || assigned.has(id) || recorderKey(point) !== key) fail();
      assigned.add(id); return point;
    });
    if (points.some((point, pointIndex) => pointIndex > 0 && compareArchivePoints(points[pointIndex - 1], point) > 0)) fail();
    if (value.firstTimestamp !== points[0].tst || value.lastTimestamp !== points.at(-1).tst || value.tripCount !== value.journal?.trips?.length || value.stayCount !== value.journal?.stays?.length) fail();
    validateJournal(value.journal, points); tripCount += value.tripCount; stayCount += value.stayCount;
  }
  if (assigned.size !== payload.points.length || payload.tripCount !== tripCount || payload.stayCount !== stayCount || payload.firstTimestamp !== payload.points[0]?.tst || payload.lastTimestamp !== payload.points.at(-1)?.tst) fail();
  return payload;
}

export function archiveSelection(payload, selectedKey) {
  if (payload.schemaVersion === 1) return { points: payload.points, journal: payload.journal, recorderMismatch: payload.points.some(point => recorderKey(point) !== selectedKey) };
  const value = payload.journals.find(entry => recorderKey(entry) === selectedKey);
  if (!value) return { points: [], journal: null, recorderMismatch: true };
  const byId = new Map(payload.points.map(point => [point.id, point]));
  return { points: value.pointIds.map(id => byId.get(id)), journal: value.journal, recorderMismatch: false };
}

export function archiveMatchesContent(payload, content) {
  return payload.schemaVersion === 2 && same(archiveHashInput(payload), content);
}

export function archiveSelectionMatches(payload, selectedKey, points, journal) {
  const saved = archiveSelection(payload, selectedKey);
  return !saved.recorderMismatch && saved.points.length === points.length && saved.points.every((point, index) => point.id === points[index]?.id) && same(saved.journal, journal);
}
