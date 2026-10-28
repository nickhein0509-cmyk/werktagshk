import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { selectPoints } from '../../supabase/functions/assistance/domain.mjs';

// The real document, modules and bundled Leaflet are exercised. Every account,
// location and record below is synthetic; external tiles never leave the test.
const today = '2026-10-28';
const stamp = '2026-10-28T12:00:00.000Z';
const csrf = 'synthetic-timeline-csrf';
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6Lz0AAAAASUVORK5CYII=', 'base64');
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
  noGPS?: boolean;
  leafletUnavailable?: boolean;
  tilesUnavailable?: boolean;
  seeds?: Array<{ date: string; entry: ManualEntry }>;
} = {}) {
  let authorized = true;
  let noGPS = options.noGPS ?? false;
  let leafletUnavailable = options.leafletUnavailable ?? false;
  let tilesUnavailable = options.tilesUnavailable ?? false;
  let rangeFailures = 0;
  const requestedDays: string[] = [], tileRequests: string[] = [];
  const documents = new Map<string, ReturnType<typeof emptyContext>>();
  for (const { date, entry } of options.seeds ?? []) {
    const document = documents.get(date) ?? emptyContext(date);
    document.entries.push(entry);
    document.revision++;
    documents.set(date, document);
  }
  await page.clock.install({ time: new Date(stamp) });
  await page.addInitScript(() => {
    localStorage.removeItem('werktag-learning-auth');
    sessionStorage.removeItem('werktag-assistance-clear-on-boot');
  });
  await page.route('https://test-werktag.supabase.co/**', route => route.fulfill({ json: {} }));
  await page.route('https://tile.openstreetmap.org/**', route => {
    tileRequests.push(route.request().url());
    return tilesUnavailable ? route.abort('failed') : route.fulfill({ contentType: 'image/png', body: pixel });
  });
  await page.route(url => url.pathname === '/assistance-assets/vendor/leaflet.js', async route => {
    if (leafletUnavailable) return route.abort('failed');
    const response = await page.request.get('/assistance-assets/vendor/leaflet.js');
    // Observe actual renderer calls without replacing the Leaflet implementation.
    const probe = `\n;(() => {
      window.__timelinePolylines = [];
      window.__timelineFits = 0;
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
    return route.fulfill({ response });
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
    const date = new URL(route.request().url()).searchParams.get('date') ?? today;
    requestedDays.push(date);
    const data = selectPoints(noGPS ? [] : points, date);
    return route.fulfill({ json: {
      ...data, refreshedAt: stamp,
      health: { date, status: 'empty', metrics: {}, days: [], fetchedAt: stamp },
      archive: { enabled: true, days: [], status: { ok: true } },
      ingestion: { lastMessageAt: stamp, observedSince: stamp },
    } });
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
    requestedDays, tileRequests,
    expire: () => { authorized = false; },
    recoverLeaflet: () => { leafletUnavailable = false; },
    recoverTiles: () => { tilesUnavailable = false; },
    clearGPS: () => { noGPS = true; },
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
  await page.locator('#view-workspace').click();
  await expect(page.locator('#workspace-save')).toBeEnabled();
  await page.locator('#workspace-note').fill('Synthetischer Entwurf trotz fehlender Karte');
  await page.locator('#view-day').click();
  state.recoverLeaflet();
  await page.locator('#map-retry').click();
  await expect(page.locator('#map')).toHaveClass(/leaflet-container/);
  await page.locator('#view-workspace').click();
  await expect(page.locator('#workspace-note')).toHaveValue('Synthetischer Entwurf trotz fehlender Karte');
  expect(errors).toEqual([]);
});

test('failed map tiles keep measured paths and can be retried without losing the selected section', async ({ page }) => {
  const state = await timelineFixture(page, { tilesUnavailable: true });
  await openDay(page);
  await expect(page.locator('#map-retry')).toBeVisible();
  await expect(page.locator('#map-message')).toContainText(/Kartenhintergrund/);
  await page.locator('#timeline .event.trip').first().click();
  await expect(page.locator('#timeline .event.trip').first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.leaflet-overlay-pane path')).not.toHaveCount(0);
  const requests = state.tileRequests.length;
  state.recoverTiles();
  await page.locator('#map-retry').click();
  await expect.poll(() => state.tileRequests.length).toBeGreaterThan(requests);
  await expect(page.locator('#timeline .event.trip').first()).toHaveAttribute('aria-pressed', 'true');
});

test('empty GPS remains an honest empty day and an expired session erases the private map and draft', async ({ page }) => {
  const state = await timelineFixture(page, { noGPS: true });
  await openDay(page);
  await expect(page.locator('#timeline .event')).toHaveCount(0);
  await expect(page.locator('#timeline-empty')).toContainText(/keine.*GPS|keine.*Standort/i);
  await page.locator('#view-workspace').click();
  await page.locator('#workspace-note').fill('Synthetischer privater Entwurf');
  await page.locator('#view-day').click();
  state.expire();
  await page.locator('.journey-diagnostics summary').click();
  await page.locator('#refresh-now').click();
  await expect(page.locator('#access')).toBeVisible();
  await expect(page.locator('.leaflet-container')).toHaveCount(0);
  await expect(page.locator('#timeline .event')).toHaveCount(0);
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
  await page.locator('#workspace-focus-overdue').click();
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
  await page.locator('#view-workspace').click();
  state.failRangeOnce();
  await page.locator('#workspace-period').selectOption('90');
  await expect(page.locator('#workspace-range-label')).toContainText('Nicht vollständig geladen');
  await expect(page.locator('.workspace-card')).toHaveCount(0);
  await page.locator('#view-overview').click();
  await expect(page.locator('#workspace-focus-overdue strong')).toHaveText('–');
  await expect(page.locator('#workspace-focus-overdue')).toBeDisabled();
  await expect(page.locator('#workspace-focus-message')).toContainText('noch nicht vollständig geladen');
  await page.locator('#workspace-refresh').click();
  await expect(page.locator('#workspace-focus-overdue strong')).toHaveText('2');
  await expect(page.locator('#workspace-focus-overdue')).toBeEnabled();
  await page.locator('#view-workspace').click();
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
    await page.locator('#view-workspace').click();
    const workspace = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
    expect(workspace.width).toBeLessThanOrEqual(workspace.viewport + 1);
  });
}
