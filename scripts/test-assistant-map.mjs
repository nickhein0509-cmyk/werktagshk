import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeRoute } from '../public/assistance-assets/route.js';
import { measuredEndpoints, recorderKey, recorderLabel, recorderQuery } from '../public/assistance-assets/map-presentation.js';

const points = [
  { lat: 49, lon: 8, tst: 1000, acc: 10 },
  { lat: 49.0004, lon: 8, tst: 1060, acc: 10 },
  { lat: 49.00042, lon: 8, tst: 1120, acc: 10 },
];

test('the last measured marker survives line smoothing without changing the route distance', () => {
  const analysis = analyzeRoute(points), endpoints = measuredEndpoints(points);
  assert.equal(analysis.segments.flat().at(-1).tst, 1060);
  assert.equal(endpoints.end, points[2]);
  assert.equal(endpoints.start, points[0]);
  assert.ok(analysis.distanceMetres > 40 && analysis.distanceMetres < 45);
});

test('a day spent at one stay retains the actual first and last measurement', () => {
  const analysis = analyzeRoute(points, { journal: { stays: [{ startIndex: 0, endIndex: 2 }] } });
  assert.deepEqual(analysis.segments.flat(), [points[2]]);
  assert.equal(analysis.distanceMetres, 0);
  assert.deepEqual(measuredEndpoints(points), { start: points[0], end: points[2] });
});

test('endpoint markers never restore invalid or inaccurate fixes removed from the route', () => {
  const unknownAccuracy = { lat: 49.01, lon: 8.01, tst: 1200 };
  const rows = [{ ...points[0], lat: 91 }, { ...points[0], acc: -1 }, ...points, unknownAccuracy,
    { ...points[2], acc: 101 }, { ...points[2], lon: NaN }, { ...points[2], tst: -1 }];
  assert.deepEqual(measuredEndpoints(rows), { start: points[0], end: unknownAccuracy });
  assert.equal(measuredEndpoints([]), null);
  assert.equal(measuredEndpoints([{ ...points[0], acc: Infinity }]), null);
});

test('recorder selection preserves the complete device name without query injection', () => {
  const recorder = { source: 'werktag_ios', device: 'iPhone & Familie / +1?source=other#"' };
  const query = recorderQuery('2026-10-28', recorder);
  assert.equal(new URLSearchParams(String(query)).get('device'), recorder.device);
  assert.equal(query.getAll('source').length, 1);
  assert.equal(query.get('source'), 'werktag_ios');
  assert.equal(query.get('date'), '2026-10-28');
  assert.equal(recorderLabel(recorder), 'WerkTag iPhone · ' + recorder.device);
  assert.notEqual(recorderKey(recorder), recorderKey({ ...recorder, device: 'other' }));
  assert.equal(String(recorderQuery('all', null)), 'date=all');
});
