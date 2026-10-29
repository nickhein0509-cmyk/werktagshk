import { mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { selectPoints, statisticsFromData } from '../../supabase/functions/assistance/domain.mjs';

// The real document, modules and bundled Leaflet are exercised. Every account,
// location and record below is synthetic; external tiles never leave the test.
const today = '2026-10-28';
const stamp = '2026-10-28T12:00:00.000Z';
const csrf = 'synthetic-timeline-csrf';
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6Lz0AAAAASUVORK5CYII=', 'base64');
const productionHeaders = JSON.parse(readFileSync('vercel.json', 'utf8')).headers
  .find((rule: { source: string }) => rule.source === '/assistenz').headers as Array<{ key: string; value: string }>;
const productionReferrerPolicy = productionHeaders.find(header => header.key.toLowerCase() === 'referrer-policy')!.value;

// A real, tiny MVT polygon exercises MapLibre's worker/parser and renderer.
// Every requested tile is synthetic; no live maps or locations leave the test.
function varint(value: number): Buffer {
  const bytes: number[] = [];
  while (value > 127) { bytes.push((value & 127) | 128); value = Math.floor(value / 128); }
  return Buffer.from([...bytes, value]);
}
const field = (number: number, value: Buffer) => Buffer.concat([varint((number << 3) | 2), varint(value.length), value]);
const integer = (number: number, value: number) => Buffer.concat([varint(number << 3), varint(value)]);
const geometry = Buffer.concat([9, 0, 0, 26, 8192, 0, 0, 8192, 8191, 0, 15].map(varint));
const feature = Buffer.concat([integer(1, 1), integer(3, 3), field(4, geometry)]);
const vectorTile = field(3, Buffer.concat([
  field(1, Buffer.from('terrain')), field(2, feature), integer(5, 4096), integer(15, 2),
]));
const vectorStyle = {
  version: 8, name: 'Synthetic isolated basemap',
  sources: { fixture: { type: 'vector', tiles: ['https://tiles.openfreemap.org/synthetic/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 14 } },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#c6dfe0' } },
    { id: 'land', type: 'fill', source: 'fixture', 'source-layer': 'terrain', paint: { 'fill-color': '#ede9da', 'fill-outline-color': '#99aaa5' } },
  ],
};
const start = Date.parse('2026-10-28T07:00:00Z') / 1000;
const locations = [
  [0, 52.5, 13.4], [60, 52.501, 13.402], [120, 52.502, 13.404],
  [420, 52.50201, 13.40401], [720, 52.50202, 13.40402], [1020, 52.50201, 13.40401],
  [1080, 52.504, 13.408], [1140, 52.506, 13.412],
  [2940, 52.509, 13.417], [3000, 52.51, 13.419], [3060, 52.511, 13.421],
];
const points = locations.map(([offset, lat, lon], index) => ({
  id: 'synthetic-timeline-point-' + index,
  tst: start + offset, lat, lon, acc: 8,
  receivedAt: new Date((start + offset) * 1000 + 2000).toISOString(),
}));
type TimelinePoint = typeof points[number] & { source?: string; device?: string };
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
};
interface ManualEntry {
  id: string;
  kind: 'note' | 'task';
  title?: string;
  note?: string;
  status?: 'open' | 'done';
  dueDate?: string;
  source: { provider: 'MANUAL'; sourceId: null };
  createdAt: string;
  updatedAt: string;
  revision: number;
}
const taskEntry = (id: number, title: string, dueDate?: string, status: 'open' | 'done' = 'open'): ManualEntry => ({
  id: `11111111-1111-4111-8111-${String(id).padStart(12, '0')}`,
  kind: 'task', title, status, ...(dueDate ? { dueDate } : {}),
  source: { provider: 'MANUAL', sourceId: null },
  createdAt: stamp, updatedAt: stamp, revision: 1,
});
const emptyContext = (date: string) => ({
  schemaVersion: 1, date, timezone: 'Europe/Berlin', revision: 0, updatedAt: null, entries: [] as ManualEntry[],
});

async function timelineFixture(page: Page, options: {
  points?: TimelinePoint[];
  omitRecorderMetadata?: boolean;
  noGPS?: boolean;
  leafletUnavailable?: boolean;
  tilesUnavailable?: boolean;
  vectorUnavailable?: boolean;
  emptyVectorStyle?: boolean;
  holdVectorStyle?: boolean;
  webglUnavailable?: boolean;
  fullProductionCSP?: boolean;
  seeds?: Array<{ date: string; entry: ManualEntry }>;
} = {}) {
  let authorized = true;
  let noGPS = options.noGPS ?? false;
  let leafletUnavailable = options.leafletUnavailable ?? false;
  let tilesUnavailable = options.tilesUnavailable ?? false;
  let vectorUnavailable = options.vectorUnavailable ?? false;
  let heldStyle: { release: () => void; requested: Promise<void> } | undefined;
  let markStyleRequested: (() => void) | undefined;
  let releaseStyle: (() => void) | undefined;
  const styleRequested = new Promise<void>(resolve => { markStyleRequested = resolve; });
  const styleReleased = new Promise<void>(resolve => { releaseStyle = resolve; });
  if (options.holdVectorStyle) heldStyle = { release: () => releaseStyle!(), requested: styleRequested };
  let rangeFailures = 0;
  let recordedPoints = options.points ?? points;
  let delayedStatistics: { started: ReturnType<typeof deferred>; pause: ReturnType<typeof deferred>; finished: ReturnType<typeof deferred> } | null = null;
  const dataRequests: URL[] = [], statisticsRequests: URL[] = [];
  const requestedDays: string[] = [], tileRequests: string[] = [], tileReferrers: Array<string | undefined> = [], vectorRequests: string[] = [];
  const documents = new Map<string, ReturnType<typeof emptyContext>>();
  for (const { date, entry } of options.seeds ?? []) {
    const document = documents.get(date) ?? emptyContext(date);
    document.entries.push(entry);
    document.revision++;
    documents.set(date, document);
  }
  // Keep the synthetic calendar deterministic while retaining native rAF and
  // worker timing for the actual MapLibre renderer.
  await page.clock.setFixedTime(new Date(stamp));
  await page.addInitScript(() => {
    localStorage.removeItem('werktag-learning-auth');
    sessionStorage.removeItem('werktag-assistance-clear-on-boot');
  });
  if (options.webglUnavailable) await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type.includes('webgl')) return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.route('https://test-werktag.supabase.co/**', route => route.fulfill({ json: {} }));
  await page.route('https://tile.openstreetmap.org/**', async route => {
    tileRequests.push(route.request().url());
    tileReferrers.push((await route.request().allHeaders()).referer);
    return tilesUnavailable ? route.abort('failed') : route.fulfill({ contentType: 'image/png', body: pixel });
  });
  await page.route('https://tiles.openfreemap.org/**', async route => {
    const url = new URL(route.request().url());
    vectorRequests.push(url.pathname);
    if (url.pathname.startsWith('/styles/')) {
      markStyleRequested!();
      if (options.holdVectorStyle) await styleReleased;
    }
    if (vectorUnavailable) return route.fulfill({ status: 503, json: { error: 'Synthetic provider failure' } });
    if (url.pathname.startsWith('/styles/')) return route.fulfill({ json: options.emptyVectorStyle ? { version: 8, sources: {}, layers: [] } : vectorStyle });
    if (url.pathname.startsWith('/synthetic/')) return route.fulfill({ contentType: 'application/x-protobuf', body: vectorTile });
    return route.abort('failed');
  });
  await page.route(url => url.pathname === '/assistance-assets/vendor/leaflet.js', async route => {
    if (leafletUnavailable) return route.abort('failed');
    const response = await page.request.get('/assistance-assets/vendor/leaflet.js');
    // Observe actual renderer calls without replacing the Leaflet implementation.
    const probe = `\n;(() => {
      window.__timelinePolylines = [];
      window.__timelineFits = 0;
      const createMap = L.map;
      L.map = function (...args) { window.__timelineMap = createMap.apply(this, args); return window.__timelineMap; };
      const polyline = L.polyline;
      L.polyline = function (coordinates, ...args) {
        window.__timelinePolylines.push(coordinates);
        return polyline.call(this, coordinates, ...args);
      };
      const fitBounds = L.Map.prototype.fitBounds;
      L.Map.prototype.fitBounds = function (...args) {
        window.__timelineFits++;
        return fitBounds.apply(this, args);
      };
    })();`;
    return route.fulfill({ contentType: 'text/javascript', body: await response.text() + probe });
  });
  await page.route(url => url.pathname === '/assistenz', async route => {
    const response = await page.request.get('/assistance.html');
    const headers: Record<string, string> = { ...response.headers(), 'referrer-policy': productionReferrerPolicy };
    if (options.fullProductionCSP) {
      // The fixture's account host replaces only the real project's host.
      headers['content-security-policy'] = productionHeaders.find(header => header.key.toLowerCase() === 'content-security-policy')!.value
        .replaceAll('https://mvkksfecimpjnytvbrrb.supabase.co', 'https://test-werktag.supabase.co');
    }
    return route.fulfill({ response, headers });
  });
  await page.route(url => /^\/assistenz\/(?:app-v\d+|route|health-v\d+|context-v\d+|statistics-v\d+)\.js$/.test(url.pathname), async route => {
    const name = new URL(route.request().url()).pathname.split('/').at(-1)!;
    const asset = name.startsWith('app-v') ? 'app.js'
      : name.startsWith('health-v') ? 'health.js'
      : name.startsWith('context-v') ? 'context.js'
      : name.startsWith('statistics-v') ? 'statistics.js' : 'route.js';
    const response = await page.request.get('/assistance-assets/' + asset);
    return route.fulfill({ response, contentType: 'text/javascript' });
  });
  await page.route(url => url.pathname === '/assistenz/session', route => route.fulfill({
    status: authorized ? 200 : 401,
    json: authorized ? { canRead: true, canWrite: true, csrfToken: csrf, accountBound: false } : { error: 'Synthetische Sitzung gesperrt' },
  }));
  await page.route(url => url.pathname === '/assistenz/logout', route => {
    authorized = false;
    return route.fulfill({ json: { ok: true } });
  });
  await page.route(url => url.pathname === '/assistenz/data', route => {
    if (!authorized) return route.fulfill({ status: 401, json: { error: 'Gesperrt' } });
    const url = new URL(route.request().url()), date = url.searchParams.get('date') ?? today;
    dataRequests.push(url);
    requestedDays.push(date);
    const recorder = url.searchParams.has('source') ? { source: url.searchParams.get('source'), device: url.searchParams.get('device') } : {};
    const data = selectPoints(noGPS ? [] : recordedPoints, date, 20000, recorder);
    if (options.omitRecorderMetadata) { delete data.recorders; delete data.selectedRecorder; }
    return route.fulfill({ json: {
      ...data, refreshedAt: stamp,
      health: { date, status: 'empty', metrics: {}, days: [], fetchedAt: stamp },
      archive: { enabled: true, days: [], status: { ok: true } },
      ingestion: { lastMessageAt: stamp, observedSince: stamp },
    } });
  });
  await page.route(url => url.pathname === '/assistenz/statistics', async route => {
    if (!authorized) return route.fulfill({ status: 401, json: { error: 'Gesperrt' } });
    const url = new URL(route.request().url()); statisticsRequests.push(url);
    const recorder = url.searchParams.has('source') ? { source: url.searchParams.get('source'), device: url.searchParams.get('device') } : {};
    const json = statisticsFromData({ points: noGPS ? [] : recordedPoints,
      from: url.searchParams.get('from'), to: url.searchParams.get('to'), bucket: url.searchParams.get('bucket'),
      now: Date.parse(stamp), ...recorder,
    });
    const held = delayedStatistics; delayedStatistics = null;
    if (held) { held.started.resolve(); await held.pause.promise; }
    try { return await route.fulfill({ json }); } finally { held?.finished.resolve(); }
  });
  await page.route(url => url.pathname === '/assistenz/context', route => {
    if (!authorized) return route.fulfill({ status: 401, json: { error: 'Gesperrt' } });
    if (route.request().method() !== 'GET') return route.fulfill({ status: 400, json: { error: 'This fixture does not write records' } });
    const date = new URL(route.request().url()).searchParams.get('date') ?? today;
    return route.fulfill({ json: documents.get(date) ?? emptyContext(date) });
  });
  await page.route(url => url.pathname === '/assistenz/context-range', route => {
    if (!authorized) return route.fulfill({ status: 401, json: { error: 'Gesperrt' } });
    if (rangeFailures > 0) { rangeFailures--; return route.fulfill({ status: 503, json: { error: 'Synthetisch unvollständiger Zeitraum' } }); }
    const url = new URL(route.request().url());
    const from = url.searchParams.get('from') ?? '', to = url.searchParams.get('to') ?? '';
    return route.fulfill({ json: {
      schemaVersion: 1, timezone: 'Europe/Berlin', from, to,
      documents: [...documents.values()].filter(value => value.date >= from && value.date <= to)
        .map(value => ({ date: value.date, revision: value.revision, entries: value.entries })),
    } });
  });
  return {
    requestedDays, tileRequests, tileReferrers, vectorRequests, heldStyle, dataRequests, statisticsRequests,
    replacePoints: (next: TimelinePoint[]) => { recordedPoints = next; },
    holdNextStatistics: () => {
      const held = { started: deferred(), pause: deferred(), finished: deferred() }; delayedStatistics = held;
      return { requested: held.started.promise, release: held.pause.resolve, finished: held.finished.promise };
    },
    expire: () => { authorized = false; },
    reauthorize: () => { authorized = true; },
    recoverLeaflet: () => { leafletUnavailable = false; },
    recoverTiles: () => { tilesUnavailable = false; },
    failTiles: () => { tilesUnavailable = true; },
    recoverVector: () => { vectorUnavailable = false; },
    clearGPS: () => { noGPS = true; },
    restoreGPS: () => { noGPS = false; },
    failRangeOnce: () => { rangeFailures++; },
  };
}

async function openDay(page: Page) {
  await page.goto('/assistenz');
  await expect(page.locator('#view-day')).toBeEnabled();
  await page.locator('#view-day').click();
  await expect(page.locator('#day-view')).toBeVisible();
  await expect(page.locator('#calendar-day')).toHaveValue(today);
}

test('timeline preserves real gaps, selects measured sections and fits the selected map', async ({ page }) => {
  const state = await timelineFixture(page);
  await page.goto('/assistenz');
  await expect(page.locator('#workspace-save')).toBeEnabled();
  expect(state.tileRequests).toHaveLength(0);
  await expect(page.locator('.leaflet-container')).toHaveCount(0);
  await page.locator('#view-day').click();
  await expect(page.locator('#timeline .event')).toHaveCount(4);
  await expect(page.locator('.timeline-gap')).toHaveCount(1);
  await expect(page.locator('.timeline-gap')).toContainText(/30\s*Min/);
  await expect(page.locator('.timeline-gap button')).toHaveCount(0);
  await expect(page.locator('#map')).toHaveClass(/leaflet-container/);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __timelinePolylines: number[][][] }).__timelinePolylines.length)).toBeGreaterThan(0);
  const lines = await page.evaluate(() => (window as unknown as { __timelinePolylines: number[][][] }).__timelinePolylines);
  // No rendered route is allowed to join the two sides of the missing half hour.
  expect(lines.some(line => line.some(([lat]) => lat <= 52.506) && line.some(([lat]) => lat >= 52.509))).toBe(false);
  const fits = await page.evaluate(() => (window as unknown as { __timelineFits: number }).__timelineFits);
  const stay = page.locator('#timeline .event.stay');
  await stay.click();
  await expect(stay).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#map-selection-summary')).toContainText(/Aufenthalt/);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __timelineFits: number }).__timelineFits)).toBeGreaterThan(fits);
  await page.locator('#whole-day').click();
  await expect(page.locator('#timeline .event[aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator('#quality')).toContainText(/keine.*Straßenstrecke/i);
});

test('map selection keeps quiet context and keyboard stay markers fit the complete radius on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await timelineFixture(page);
  await openDay(page);
  await page.locator('#timeline .event.trip').first().click();
  await expect(page.locator('.journey-route.is-selected')).toHaveCount(1);
  expect(await page.locator('.journey-route.is-context').count()).toBeGreaterThan(0);
  await expect(page.locator('.journey-route-halo').first()).toBeAttached();
  const stay = page.getByRole('button', { name: /^Aufenthalt 1 ·/ });
  await stay.focus();
  await stay.press('Space');
  await expect(page.locator('#timeline .event.stay')).toBeFocused();
  await expect(page.locator('#timeline .event.stay')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#map-mode')).toHaveText('Aufenthalt 1');
  const circle = await page.locator('.journey-stay-area').boundingBox();
  const map = await page.locator('#map').boundingBox();
  expect(circle).not.toBeNull(); expect(map).not.toBeNull();
  expect(circle!.x).toBeGreaterThan(map!.x + 20);
  expect(circle!.y).toBeGreaterThan(map!.y + 20);
  expect(circle!.x + circle!.width).toBeLessThan(map!.x + map!.width - 20);
  expect(circle!.y + circle!.height).toBeLessThan(map!.y + map!.height - 20);
  const target = await stay.boundingBox();
  expect(target!.width).toBeGreaterThanOrEqual(44); expect(target!.height).toBeGreaterThanOrEqual(44);
});

test('smoothed terminal fixes retain the actual last marker and legacy metadata remains optional', async ({ page }) => {
  const measured = [
    { ...points[0] }, { ...points[1] },
    { ...points[2], lat: points[1].lat + .00001, lon: points[1].lon },
  ];
  await timelineFixture(page, { points: measured, omitRecorderMetadata: true });
  await openDay(page);
  await expect(page.locator('.journey-marker--start')).toHaveAttribute('aria-label', /08:00 Uhr/);
  await expect(page.locator('.journey-marker--end')).toHaveAttribute('aria-label', /08:02 Uhr/);
  await page.locator('.journey-marker--end').focus();
  await page.locator('.journey-marker--end').press('Space');
  await expect(page.locator('.leaflet-popup-content')).toContainText('08:02 Uhr');
  await expect(page.locator('#recorder-control')).toBeHidden();
});

test('incoming measurements preserve the timeline keyboard focus', async ({ page }) => {
  const state = await timelineFixture(page);
  await openDay(page);
  const trip = page.locator('#timeline .event.trip').first();
  await trip.focus();
  state.replacePoints([...points, { ...points.at(-1)!, id: 'synthetic-new-point', lat: 52.512, tst: start + 3120, receivedAt: '2026-10-28T12:01:00.000Z' }]);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.locator('#count')).toHaveText('12');
  await expect(trip).toBeFocused();
});

test('recorder selection keeps source and device together through map, statistics and return to a day', async ({ page }) => {
  const own = { source: 'iphone', device: 'iPhone & Familie / +1' };
  const native = { source: 'werktag_ios', device: 'WerkTag Testgerät' };
  const records = [
    ...points.map(point => ({ ...point, ...own })),
    ...points.map(point => ({ ...point, ...native, id: point.id + '-native', tst: point.tst + 60, lat: point.lat + .2 })),
  ];
  const state = await timelineFixture(page, { points: records });
  await openDay(page);
  await expect(page.locator('#recorder-note')).toContainText('WerkTag iPhone');
  await expect(page.locator('#count')).toHaveText(String(points.length));
  await page.locator('#recorder').selectOption(JSON.stringify([own.source, own.device]));
  await expect(page.locator('#recorder-note')).toContainText(own.device);
  expect(state.dataRequests.at(-1)!.searchParams.get('source')).toBe(own.source);
  expect(state.dataRequests.at(-1)!.searchParams.get('device')).toBe(own.device);
  await expect(page.locator('#count')).toHaveText(String(points.length));
  await page.locator('#view-statistics').click();
  await expect(page.locator('#statistics-source')).toContainText(own.device);
  expect(state.statisticsRequests.at(-1)!.searchParams.get('source')).toBe(own.source);
  expect(state.statisticsRequests.at(-1)!.searchParams.get('device')).toBe(own.device);
  await page.locator('#statistics-days button').last().click();
  await expect(page.locator('#recorder')).toHaveValue(JSON.stringify([own.source, own.device]));
  expect(state.dataRequests.at(-1)!.searchParams.get('device')).toBe(own.device);
  await page.locator('#logout').click();
  await expect(page.locator('#recorder-control')).toBeHidden();
  await expect(page.locator('.journey-marker')).toHaveCount(0);
  await expect(page.locator('#statistics-source')).toBeEmpty();
  state.reauthorize();
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.locator('#view-day')).toBeEnabled();
  await page.locator('#view-day').click();
  await expect(page.locator('#recorder')).toHaveValue('');
  await expect(page.locator('#recorder-note')).toContainText('WerkTag iPhone');
});

test('a delayed statistic from the previous recorder cannot replace the newly selected source', async ({ page }) => {
  const own = { source: 'iphone', device: 'OwnTracks Testgerät' }, native = { source: 'werktag_ios', device: 'WerkTag Testgerät' };
  const records = [...points.map(point => ({ ...point, ...own })),
    ...points.map(point => ({ ...point, ...native, id: point.id + '-native', tst: point.tst + 60, lat: point.lat + .2 }))];
  const state = await timelineFixture(page, { points: records });
  await openDay(page);
  await page.locator('#recorder').selectOption(JSON.stringify([own.source, own.device]));
  await expect(page.locator('#recorder-note')).toContainText(own.device);
  const held = state.holdNextStatistics();
  await page.locator('#view-statistics').click();
  await held.requested;
  await page.locator('#view-day').click();
  await page.locator('#recorder').selectOption(JSON.stringify([native.source, native.device]));
  await expect(page.locator('#recorder-note')).toContainText(native.device);
  await page.locator('#view-statistics').click();
  await expect(page.locator('#statistics-source')).toContainText(native.device);
  held.release(); await held.finished;
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.locator('#statistics-source')).toContainText(native.device);
  await expect(page.locator('#statistics-source')).not.toContainText(own.device);
});

test('previous, next and today controls load explicit dates without inventing data on empty days', async ({ page }) => {
  const state = await timelineFixture(page);
  await openDay(page);
  await page.locator('#day-previous').click();
  await expect(page.locator('#calendar-day')).toHaveValue('2026-10-27');
  await expect.poll(() => state.requestedDays.at(-1)).toBe('2026-10-27');
  await expect(page.locator('#timeline .event')).toHaveCount(0);
  await expect(page.locator('#timeline-empty')).toBeVisible();
  await page.locator('#day-next').click();
  await expect(page.locator('#calendar-day')).toHaveValue(today);
  await expect(page.locator('#timeline .event')).toHaveCount(4);
  await page.locator('#calendar-day').fill('2026-10-20');
  await page.locator('#calendar-day').press('Tab');
  await expect.poll(() => state.requestedDays.at(-1)).toBe('2026-10-20');
  await page.locator('#day-today').click();
  await expect(page.locator('#calendar-day')).toHaveValue(today);
  await expect(page.locator('#timeline .event')).toHaveCount(4);
});

test('a missing map library has a recoverable error while personal drafts remain usable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = await timelineFixture(page, { leafletUnavailable: true });
  await openDay(page);
  await expect(page.locator('#map-retry')).toBeVisible();
  await expect(page.locator('#timeline .event')).toHaveCount(4);
  if (!await page.locator('#view-workspace').isVisible()) await page.locator('.assistant-more > summary').first().click();
  await page.locator('#view-workspace').click();
  if (!await page.locator('#workspace-form').isVisible()) await page.locator('#workspace-capture > summary').click();
  await expect(page.locator('#workspace-save')).toBeEnabled();
  await page.locator('#workspace-note').fill('Synthetischer Entwurf trotz fehlender Karte');
  await page.locator('#view-day').click();
  state.recoverLeaflet();
  await page.locator('#map-retry').click();
  await expect(page.locator('#map')).toHaveClass(/leaflet-container/);
  if (!await page.locator('#view-workspace').isVisible()) await page.locator('.assistant-more > summary').first().click();
  await page.locator('#view-workspace').click();
  if (!await page.locator('#workspace-form').isVisible()) await page.locator('#workspace-capture > summary').click();
  await expect(page.locator('#workspace-note')).toHaveValue('Synthetischer Entwurf trotz fehlender Karte');
  expect(errors).toEqual([]);
});

test('failed map tiles keep measured paths and can be retried without losing the selected section', async ({ page }) => {
  const state = await timelineFixture(page, { tilesUnavailable: true });
  await openDay(page);
  await page.locator('#map-provider').selectOption('osm');
  await expect(page.locator('#map-retry')).toBeVisible();
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'error');
  await page.locator('#timeline .event.trip').first().click();
  await expect(page.locator('#timeline .event.trip').first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.leaflet-overlay-pane path')).not.toHaveCount(0);
  const requests = state.tileRequests.length;
  state.recoverTiles();
  await page.locator('#map-retry').click();
  await expect.poll(() => state.tileRequests.length).toBeGreaterThan(requests);
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#map-retry')).toBeHidden();
  await expect(page.locator('#timeline .event.trip').first()).toHaveAttribute('aria-pressed', 'true');
});

test('new default basemap renders synthetic vector tiles with the production document policy', async ({ page, browserName }) => {
  const state = await timelineFixture(page, { fullProductionCSP: true });
  await page.goto('/assistenz');
  await expect(page.locator('#view-day')).toBeEnabled();
  expect(await page.evaluate(async () => {
    const faces = await document.fonts.load('16px Manrope');
    return faces.length > 0 && faces.every(face => face.status === 'loaded');
  })).toBe(true);
  expect(state.vectorRequests).toEqual([]);
  expect(state.tileRequests).toEqual([]);
  await page.locator('#view-day').click();
  await expect(page.locator('#map-provider')).toHaveValue('openfreemap');
  await expect(page.locator('#timeline .event')).toHaveCount(4);
  const hasWebGL = await page.evaluate(() => {
    const context = document.createElement('canvas').getContext('webgl2');
    const supported = Boolean(context);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return supported;
  });
  if (!hasWebGL && browserName === 'webkit') {
    // Mobile WebKit on some CI hosts lacks WebGL. This is an error boundary,
    // never presented as a successful vector render or a physical iPhone test.
    await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'error');
    await page.locator('#map-provider').selectOption('osm');
    await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'ready');
    return;
  }
  expect(hasWebGL).toBe(true);
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#map canvas.maplibregl-canvas')).toHaveCount(1);
  await expect.poll(() => state.vectorRequests.some(path => path.startsWith('/synthetic/'))).toBe(true);
  expect(state.tileRequests).toEqual([]);
  await expect(page.locator('#map .leaflet-overlay-pane path')).not.toHaveCount(0);
  await expect(page.locator('#map .leaflet-control-attribution')).toContainText(/OpenFreeMap/);
});

test('OSM receives only the real origin even under no-referrer and a private-looking URL', async ({ page }) => {
  const state = await timelineFixture(page);
  const response = await page.goto('/assistenz');
  expect(response!.headers()['referrer-policy']).toBe('no-referrer');
  await expect(page.locator('#view-day')).toBeEnabled();
  await page.locator('#view-day').click();
  await page.evaluate(() => history.replaceState(null, '', '/assistenz?private-fixture=query-do-not-send#fragment-do-not-send'));
  // The document policy is taken from production, not Vite's permissive default.
  expect(productionReferrerPolicy).toBe('no-referrer');
  await page.locator('#map-provider').selectOption('osm');
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'ready');
  await expect.poll(() => state.tileReferrers.length).toBeGreaterThan(0);
  const origin = new URL(page.url()).origin + '/';
  expect(state.tileReferrers.every(referrer => referrer === origin)).toBe(true);
  expect(state.tileReferrers.some(referrer => /query-do-not-send|fragment-do-not-send|assistenz/.test(referrer ?? ''))).toBe(false);
  await expect(page.locator('#map .leaflet-tile').first()).toHaveAttribute('referrerpolicy', 'origin');
});

test('an empty provider style is never reported as a ready street map', async ({ page }) => {
  const state = await timelineFixture(page, { emptyVectorStyle: true });
  await openDay(page);
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'error', { timeout: 25_000 });
  expect(state.vectorRequests.some(path => path.startsWith('/synthetic/'))).toBe(false);
  await expect(page.locator('#map-retry')).toBeVisible();
  await expect(page.locator('#timeline .event')).toHaveCount(4);
  await page.locator('#map-provider').selectOption('osm');
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'ready');
});

test('unsupported WebGL keeps routes and drafts available and offers a working manual alternative', async ({ page }) => {
  await timelineFixture(page, { webglUnavailable: true });
  await openDay(page);
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#map-provider')).toHaveValue('openfreemap');
  await expect(page.locator('#timeline .event')).toHaveCount(4);
  if (!await page.locator('#view-workspace').isVisible()) await page.locator('.assistant-more > summary').first().click();
  await page.locator('#view-workspace').click();
  if (!await page.locator('#workspace-form').isVisible()) await page.locator('#workspace-capture > summary').click();
  await page.locator('#workspace-note').fill('Synthetischer Entwurf ohne WebGL');
  await page.locator('#view-day').click();
  await page.locator('#timeline .event.stay').click();
  await page.locator('#map-provider').selectOption('osm');
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#timeline .event.stay')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#map-selection-summary')).toContainText('Aufenthalt');
  if (!await page.locator('#view-workspace').isVisible()) await page.locator('.assistant-more > summary').first().click();
  await page.locator('#view-workspace').click();
  if (!await page.locator('#workspace-form').isVisible()) await page.locator('#workspace-capture > summary').click();
  await expect(page.locator('#workspace-note')).toHaveValue('Synthetischer Entwurf ohne WebGL');
});

test('a failed vector provider can recover without changing the selected day or measured section', async ({ page, browserName }) => {
  const state = await timelineFixture(page, { vectorUnavailable: true });
  await openDay(page);
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'error');
  await page.locator('#timeline .event.trip').first().click();
  state.recoverVector();
  await page.locator('#map-retry').click();
  const hasWebGL = await page.evaluate(() => {
    const context = document.createElement('canvas').getContext('webgl2');
    const supported = Boolean(context);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return supported;
  });
  if (!hasWebGL && browserName === 'webkit') {
    await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'error');
    await page.locator('#map-provider').selectOption('osm');
  } else expect(hasWebGL).toBe(true);
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#map-retry')).toBeHidden();
  await expect(page.locator('#calendar-day')).toHaveValue(today);
  await expect(page.locator('#timeline .event.trip').first()).toHaveAttribute('aria-pressed', 'true');
});

test('a late vector response after lock cannot restore a private canvas, map or ready status', async ({ page, browserName }) => {
  const state = await timelineFixture(page, { holdVectorStyle: true });
  await openDay(page);
  const hasWebGL = await page.evaluate(() => {
    const context = document.createElement('canvas').getContext('webgl2');
    const supported = Boolean(context);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return supported;
  });
  if (hasWebGL) await state.heldStyle!.requested;
  else if (browserName === 'chromium') expect(hasWebGL).toBe(true);
  await page.locator('#logout').click();
  state.heldStyle!.release();
  await expect(page.locator('#access')).toBeVisible();
  await expect(page.locator('#map > *')).toHaveCount(0);
  await expect(page.locator('#timeline .event')).toHaveCount(0);
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'idle');
  await expect(page.locator('#map-retry')).toBeHidden();
  await expect(page.locator('#map-provider')).toBeDisabled();
});

test('a late vector response cannot overwrite the alternative provider or its selected section', async ({ page, browserName }) => {
  const state = await timelineFixture(page, { holdVectorStyle: true });
  await openDay(page);
  const hasWebGL = await page.evaluate(() => {
    const context = document.createElement('canvas').getContext('webgl2');
    const supported = Boolean(context);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return supported;
  });
  if (hasWebGL) await state.heldStyle!.requested;
  else if (browserName === 'chromium') expect(hasWebGL).toBe(true);
  await page.locator('#timeline .event.stay').click();
  await page.locator('#map-provider').selectOption('osm');
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'ready');
  state.heldStyle!.release();
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-provider', 'osm');
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#map canvas.maplibregl-canvas')).toHaveCount(0);
  await expect(page.locator('#timeline .event.stay')).toHaveAttribute('aria-pressed', 'true');
});

test('raster recovery clears errors when failed tiles leave the visible view', async ({ page }) => {
  const state = await timelineFixture(page, { tilesUnavailable: true });
  await openDay(page);
  await page.locator('#map-provider').selectOption('osm');
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'error');
  state.recoverTiles();
  const requests = state.tileRequests.length;
  await page.locator('#map .leaflet-control-zoom-in').click();
  await expect.poll(() => state.tileRequests.length).toBeGreaterThan(requests);
  await expect(page.locator('#basemap-status')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#map-retry')).toBeHidden();
});

test('empty GPS remains an honest empty day and an expired session erases the private map and draft', async ({ page }) => {
  const state = await timelineFixture(page, { noGPS: true });
  await openDay(page);
  await expect(page.locator('#timeline .event')).toHaveCount(0);
  await expect(page.locator('#timeline-empty')).toContainText(/keine.*GPS|keine.*Standort/i);
  // Establish private map content before testing erasure, rather than proving
  // only that an already empty day remains empty after the session expires.
  state.restoreGPS();
  await page.locator('.journey-diagnostics summary').click();
  await page.locator('#refresh-now').click();
  await expect(page.locator('#timeline .event')).toHaveCount(4);
  await page.locator('#timeline .event.stay').click();
  await expect(page.locator('#map-selection-summary')).toContainText('Ausgewählter Aufenthalt');
  await expect(page.locator('#timeline-day-summary')).toContainText('gespeicherte Messpunkte');
  await expect(page.locator('#map .leaflet-pane')).not.toHaveCount(0);
  if (!await page.locator('#view-workspace').isVisible()) await page.locator('.assistant-more > summary').first().click();
  await page.locator('#view-workspace').click();
  if (!await page.locator('#workspace-form').isVisible()) await page.locator('#workspace-capture > summary').click();
  await page.locator('#workspace-note').fill('Synthetischer privater Entwurf');
  await page.locator('#view-day').click();
  state.expire();
  await page.locator('#refresh-now').click();
  await expect(page.locator('#access')).toBeVisible();
  // Leaflet.remove() may retain its inert host class; private panes, tiles,
  // controls and geometry must nevertheless be removed from that host.
  await expect(page.locator('#map > *')).toHaveCount(0);
  await expect(page.locator('.leaflet-pane, .leaflet-tile')).toHaveCount(0);
  await expect(page.locator('#timeline .event')).toHaveCount(0);
  await expect(page.locator('#timeline-day-summary')).toHaveText('Melde dich an, um deine Wege und Aufenthalte zu sehen.');
  await expect(page.locator('#map-selection-summary')).toHaveText('Deine privaten Abschnitte erscheinen nach der Anmeldung.');
  await expect(page.locator('#timeline-date-label')).toHaveText('Deine Zeitachse');
  await expect(page.locator('#view-day')).toBeDisabled();
  await expect(page.locator('#workspace-note')).toHaveValue('');
});

test('assistant focus counts only loaded tasks and quick capture retains a separate draft', async ({ page }) => {
  await timelineFixture(page, { seeds: [
    { date: today, entry: taskEntry(1, 'Heute fällig', today) },
    { date: today, entry: taskEntry(2, 'Überfällige Fixture', '2026-10-27') },
    { date: today, entry: taskEntry(3, 'Später fällig', '2026-10-30') },
    { date: today, entry: taskEntry(4, 'Ohne Termin') },
    { date: today, entry: taskEntry(5, 'Schon erledigt', '2026-10-26', 'done') },
    { date: '2026-10-01', entry: taskEntry(6, 'Ältere überfällige Fixture', '2026-10-25') },
    { date: '2026-08-01', entry: taskEntry(7, 'Außerhalb des Suchfensters', '2026-10-25') },
  ] });
  await page.goto('/assistenz');
  await expect(page.locator('#workspace-focus-today strong')).toHaveText('1');
  await expect(page.locator('#workspace-focus-overdue strong')).toHaveText('2');
  await expect(page.locator('#workspace-focus-undated strong')).toHaveText('1');
  if (!await page.locator('#view-workspace').isVisible()) await page.locator('.assistant-more > summary').first().click();
  await page.locator('#view-workspace').click();
  await page.locator('#workspace-focus-overdue').click();
  await page.locator('#workspace-capture > summary').click();
  await expect(page.locator('#workspace-filter')).toHaveValue('task-overdue');
  await expect(page.locator('.workspace-card')).toHaveCount(2);
  await expect(page.locator('.workspace-card').filter({ hasText: 'Außerhalb des Suchfensters' })).toHaveCount(0);
  await page.locator('#workspace-quick-note').click();
  await page.locator('#workspace-note').fill('Synthetischer Notizentwurf bleibt erhalten');
  await page.locator('#workspace-quick-task').click();
  await expect(page.locator('#workspace-kind')).toHaveValue('task');
  await page.locator('#workspace-title').fill('Synthetischer Aufgabenentwurf');
  await page.locator('#workspace-quick-note').click();
  await expect(page.locator('#workspace-note')).toHaveValue('Synthetischer Notizentwurf bleibt erhalten');
  await page.locator('#workspace-quick-task').click();
  await expect(page.locator('#workspace-title')).toHaveValue('Synthetischer Aufgabenentwurf');
});

test('a failed wider search never reports partial counts and explicit range navigation recovers the requested history', async ({ page }) => {
  const state = await timelineFixture(page, { seeds: [
    { date: today, entry: taskEntry(1, 'Aktuelle überfällige Fixture', '2026-10-27') },
    { date: '2026-08-01', entry: taskEntry(2, 'Ältere überfällige Fixture', '2026-10-25') },
    { date: '2026-09-10', entry: taskEntry(3, 'Vorheriger Zeitraum', '2026-11-01') },
  ] });
  await page.goto('/assistenz');
  await expect(page.locator('#workspace-focus-overdue strong')).toHaveText('1');
  if (!await page.locator('#view-workspace').isVisible()) await page.locator('.assistant-more > summary').first().click();
  await page.locator('#view-workspace').click();
  if (!await page.locator('#workspace-form').isVisible()) await page.locator('#workspace-capture > summary').click();
  state.failRangeOnce();
  await page.locator('#workspace-period').selectOption('90');
  await expect(page.locator('#workspace-range-label')).toContainText('Nicht vollständig geladen');
  await expect(page.locator('.workspace-card')).toHaveCount(0);
  await expect(page.locator('#workspace-focus-overdue strong')).toHaveText('–');
  await expect(page.locator('#workspace-focus-overdue')).toBeDisabled();
  await expect(page.locator('#workspace-focus-message')).toContainText('noch nicht vollständig geladen');
  await page.locator('#workspace-refresh').click();
  await expect(page.locator('#workspace-focus-overdue strong')).toHaveText('2');
  await expect(page.locator('#workspace-focus-overdue')).toBeEnabled();
  if (!await page.locator('#view-workspace').isVisible()) await page.locator('.assistant-more > summary').first().click();
  await page.locator('#view-workspace').click();
  if (!await page.locator('#workspace-form').isVisible()) await page.locator('#workspace-capture > summary').click();
  await page.locator('#workspace-period').selectOption('30');
  await expect(page.locator('#workspace-range-label')).toContainText('1 passende Einträge');
  await page.locator('#workspace-range-previous').click();
  await expect(page.locator('#workspace-range-end')).toHaveValue('2026-09-28');
  await expect(page.locator('.workspace-card')).toContainText('Vorheriger Zeitraum');
  await page.locator('#workspace-range-next').click();
  await expect(page.locator('#workspace-range-end')).toHaveValue(today);
  await expect(page.locator('.workspace-card')).toContainText('Aktuelle überfällige Fixture');
});

for (const width of [320, 390, 1440]) {
  test(`timeline and assistant controls fit ${width}px with real synthetic map content`, async ({ page, browserName }) => {
    await page.setViewportSize({ width, height: 900 });
    await timelineFixture(page);
    await openDay(page);
    await expect(page.locator('#timeline .event')).toHaveCount(4);
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);
    await expect(page.locator('#day-previous')).toBeInViewport();
    await expect(page.locator('#day-next')).toBeInViewport();
    await page.locator('#timeline .event.stay').click();
    await expect(page.locator('#map-selection-summary')).toContainText(/Aufenthalt/);
    await page.keyboard.press('Tab');
    await mkdir('test-results/assistant-ui', { recursive: true });
    await page.screenshot({ path: `test-results/assistant-ui/${browserName}-timeline-${width}.png`, fullPage: true });
    if (!await page.locator('#view-workspace').isVisible()) await page.locator('.assistant-more > summary').first().click();
  await page.locator('#view-workspace').click();
  if (!await page.locator('#workspace-form').isVisible()) await page.locator('#workspace-capture > summary').click();
    const workspace = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
    expect(workspace.width).toBeLessThanOrEqual(workspace.viewport + 1);
  });
}
