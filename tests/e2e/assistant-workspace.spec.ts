import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// These tests serve the real assistant document and modules. Only the private
// data service is replaced, with isolated manual records and no real account.
const today = '2026-10-28';
const stamp = '2026-10-28T12:00:00.000Z';
const csrf = 'synthetic-workspace-csrf';
type Kind = 'note' | 'task';
interface Entry {
  id: string;
  kind: Kind;
  title?: string;
  note?: string;
  status?: 'open' | 'done';
  dueDate?: string;
  at?: string;
  source: { provider: 'MANUAL'; sourceId: null };
  createdAt: string;
  updatedAt: string;
  revision: number;
}
interface ContextDocument {
  schemaVersion: 1;
  date: string;
  timezone: 'Europe/Berlin';
  revision: number;
  updatedAt: string | null;
  entries: Entry[];
}
interface InputEntry {
  id: string;
  kind: Kind;
  title?: string;
  note?: string;
  status?: 'open' | 'done';
  dueDate?: string;
  at?: string;
}
const seededEntry = (id: string, values: Partial<Entry>): Entry => ({
  id, kind: 'note', note: 'Synthetische Notiz',
  source: { provider: 'MANUAL', sourceId: null },
  createdAt: stamp, updatedAt: stamp, revision: 1, ...values,
});
const emptyDocument = (date: string): ContextDocument => ({
  schemaVersion: 1, date, timezone: 'Europe/Berlin', revision: 0,
  updatedAt: null, entries: [],
});
const entryInput = (entry: Entry | InputEntry) => ({
  id: entry.id, kind: entry.kind,
  ...(entry.title !== undefined ? { title: entry.title } : {}),
  ...(entry.note !== undefined ? { note: entry.note } : {}),
  ...(entry.status !== undefined ? { status: entry.status } : {}),
  ...(entry.dueDate !== undefined ? { dueDate: entry.dueDate } : {}),
  ...(entry.at !== undefined ? { at: entry.at } : {}),
});

async function workspaceFixture(page: Page, seeds: Array<{ date: string; entry: Entry }> = []) {
  const documents = new Map<string, ContextDocument>();
  for (const { date, entry } of seeds) {
    const document = documents.get(date) ?? emptyDocument(date);
    document.entries.push(structuredClone(entry));
    document.revision++;
    document.updatedAt = stamp;
    documents.set(date, document);
  }
  const writes: Array<{ date: string; expectedRevision: number; operation: string; entry?: InputEntry; id?: string }> = [];
  const rangeRequests: Array<{ from: string; to: string }> = [];
  const tileRequests: string[] = [];
  const vectorRequests: string[] = [];
  let authorized = true;
  let forceConflict = false;
  let loseResponse = false;
  await page.clock.install({ time: new Date(stamp) });
  await page.addInitScript(() => {
    localStorage.removeItem('werktag-learning-auth');
    sessionStorage.removeItem('werktag-assistance-clear-on-boot');
  });
  await page.route('https://tile.openstreetmap.org/**', route => { tileRequests.push(route.request().url()); return route.abort(); });
  // Workspace failure tests never contact either live basemap provider.
  await page.route('https://tiles.openfreemap.org/**', route => { vectorRequests.push(route.request().url()); return route.abort(); });
  await page.route('https://test-werktag.supabase.co/**', route => route.fulfill({
    status: 200, contentType: 'application/json', body: '{}',
  }));
  await page.route(url => url.pathname === '/assistenz', async route => {
    const document = await page.request.get('/assistance.html');
    await route.fulfill({ response: document });
  });
  await page.route(url => /^\/assistenz\/(?:app-v\d+|route|health-v\d+|context-v\d+|statistics-v\d+)\.js$/.test(url.pathname), async route => {
    const name = new URL(route.request().url()).pathname.split('/').at(-1)!;
    const asset = name.startsWith('app-v') ? 'app.js'
      : name.startsWith('health-v') ? 'health.js'
      : name.startsWith('context-v') ? 'context.js'
      : name.startsWith('statistics-v') ? 'statistics.js' : 'route.js';
    const response = await page.request.get('/assistance-assets/' + asset);
    await route.fulfill({ response, contentType: 'text/javascript' });
  });
  await page.route(url => url.pathname === '/assistenz/session', route => route.fulfill({
    status: authorized ? 200 : 401, contentType: 'application/json',
    body: JSON.stringify(authorized
      ? { canRead: true, canWrite: true, csrfToken: csrf, accountBound: false }
      : { error: 'Synthetische Sitzung gesperrt' }),
  }));
  await page.route(url => url.pathname === '/assistenz/logout', route => {
    authorized = false;
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  // No GPS service is available. Notes/tasks must still authorize and work.
  await page.route(url => url.pathname === '/assistenz/data', route => route.fulfill({
    status: authorized ? 503 : 401, contentType: 'application/json',
    body: JSON.stringify({ error: 'Synthetischer GPS-Dienst nicht erreichbar' }),
  }));
  await page.route(url => url.pathname === '/assistenz/context-range', route => {
    if (!authorized) return route.fulfill({ status: 401, json: { error: 'Gesperrt' } });
    const url = new URL(route.request().url());
    const from = url.searchParams.get('from') ?? '';
    const to = url.searchParams.get('to') ?? '';
    rangeRequests.push({ from, to });
    return route.fulfill({ json: {
      schemaVersion: 1, timezone: 'Europe/Berlin', from, to,
      documents: [...documents.values()].filter(document => document.date >= from && document.date <= to)
        .map(document => ({ date: document.date, revision: document.revision,
          entries: document.entries.filter(entry => entry.kind === 'note' || entry.kind === 'task') })),
    } });
  });
  await page.route(url => url.pathname === '/assistenz/context', async route => {
    if (!authorized) return route.fulfill({ status: 401, json: { error: 'Gesperrt' } });
    const request = route.request();
    if (request.method() === 'GET') {
      const date = new URL(request.url()).searchParams.get('date') ?? today;
      return route.fulfill({ json: documents.get(date) ?? emptyDocument(date) });
    }
    if (request.headers()['x-csrf-token'] !== csrf) {
      return route.fulfill({ status: 403, json: { error: 'CSRF-Prüfung fehlgeschlagen' } });
    }
    const input = request.postDataJSON() as {
      date: string; expectedRevision: number; operation: 'upsert' | 'delete';
      entry?: InputEntry; id?: string;
    };
    writes.push(structuredClone(input));
    const document = documents.get(input.date) ?? emptyDocument(input.date);
    if (forceConflict) {
      forceConflict = false;
      document.entries.push(seededEntry('22222222-2222-4222-8222-222222222222', {
        title: 'Auf anderem Gerät gespeichert', note: 'Dieser neue Stand darf nicht verloren gehen.',
      }));
      document.revision++;
      document.updatedAt = stamp;
      documents.set(input.date, document);
      return route.fulfill({ status: 409, json: { error: 'Der Tag wurde inzwischen geändert.' } });
    }
    const previous = document.entries.find(entry => entry.id === (input.entry?.id ?? input.id));
    // Match the real backend's idempotent retry before the revision check.
    if (input.entry && previous && JSON.stringify(entryInput(previous)) === JSON.stringify(entryInput(input.entry))) {
      return route.fulfill({ json: document });
    }
    if (input.expectedRevision !== document.revision) {
      return route.fulfill({ status: 409, json: { error: 'Der Tag wurde inzwischen geändert.' } });
    }
    if (input.operation === 'delete') {
      document.entries = document.entries.filter(entry => entry.id !== input.id);
    } else if (input.entry) {
      const value: Entry = {
        ...input.entry, source: { provider: 'MANUAL', sourceId: null },
        createdAt: previous?.createdAt ?? stamp, updatedAt: stamp,
        revision: (previous?.revision ?? 0) + 1,
      };
      document.entries = document.entries.filter(entry => entry.id !== value.id);
      document.entries.push(value);
    }
    document.revision++;
    document.updatedAt = stamp;
    documents.set(input.date, document);
    if (loseResponse) { loseResponse = false; return route.abort('failed'); }
    return route.fulfill({ json: document });
  });
  return {
    documents, writes, rangeRequests, tileRequests, vectorRequests,
    conflictOnce: () => { forceConflict = true; },
    loseResponseOnce: () => { loseResponse = true; },
    updateExistingOnAnotherDevice: (id: string, values: Partial<InputEntry>) => {
      for (const document of documents.values()) {
        const entry = document.entries.find(candidate => candidate.id === id);
        if (!entry) continue;
        Object.assign(entry, values, { updatedAt: stamp, revision: entry.revision + 1 });
        document.revision++;
        document.updatedAt = stamp;
        return;
      }
      throw new Error('Synthetic record not found');
    },
    entries: () => [...documents.values()].flatMap(document => document.entries),
  };
}

async function openWorkspace(page: Page) {
  await page.goto('/assistenz');
  await page.locator('#view-workspace').click();
  await expect(page.locator('#workspace-form')).toBeVisible();
  await expect(page.locator('#workspace-save')).toBeEnabled();
}
async function enterNote(page: Page, title: string, note: string) {
  await page.locator('#workspace-kind').selectOption('note');
  await page.locator('#workspace-title').fill(title);
  await page.locator('#workspace-note').fill(note);
}

test('personal note CRUD survives reload and GPS failure without storing private contents in browser storage', async ({ page }) => {
  const state = await workspaceFixture(page);
  await openWorkspace(page);
  // Opening the assistant or its notes never initializes a location tile map.
  expect(state.tileRequests).toHaveLength(0);
  expect(state.vectorRequests).toHaveLength(0);
  await expect(page.locator('.leaflet-container')).toHaveCount(0);
  await page.locator('#view-day').click();
  await expect(page.locator('#map')).toHaveClass(/leaflet-container/);
  // Exercise the raster failure boundary explicitly; the default street map
  // uses vector resources and may be unavailable without WebGL on this host.
  await page.locator('#map-provider').selectOption('osm');
  await expect.poll(() => state.tileRequests.length).toBeGreaterThan(0);
  await page.locator('#view-workspace').click();
  await enterNote(page, 'Mein synthetischer Tagesplan', 'Privater Fixture-Text: Teile abholen.');
  await page.locator('#workspace-save').click();
  await expect.poll(() => state.entries().length).toBe(1);
  const card = page.locator('.workspace-card').filter({ hasText: 'Mein synthetischer Tagesplan' });
  await expect(card).toBeVisible();
  await page.reload();
  await page.locator('#view-workspace').click();
  await expect(card).toContainText('Privater Fixture-Text: Teile abholen.');
  await card.getByRole('button', { name: 'Bearbeiten', exact: true }).click();
  await page.locator('#workspace-note').fill('Privater Fixture-Text: Teile wurden bereitgelegt.');
  await page.locator('#workspace-save').click();
  await expect(card).toContainText('Teile wurden bereitgelegt.');
  const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(storage).not.toContain('Privater Fixture-Text');
  expect(storage).not.toContain(csrf);
  await card.getByRole('button', { name: 'Löschen', exact: true }).click();
  await card.getByRole('button', { name: 'Ja, löschen', exact: true }).click();
  await expect.poll(() => state.entries().length).toBe(0);
  await expect(card).toHaveCount(0);
});

test('task deadline and completion status persist and can be reopened', async ({ page }) => {
  const state = await workspaceFixture(page);
  await openWorkspace(page);
  await page.locator('#workspace-kind').selectOption('task');
  await page.locator('#workspace-title').fill('Fixture-Angebot prüfen');
  await page.locator('#workspace-due-date').fill('2026-11-02');
  await page.locator('#workspace-save').click();
  const card = page.locator('.workspace-card').filter({ hasText: 'Fixture-Angebot prüfen' });
  await expect(card).toBeVisible();
  await expect.poll(() => state.entries()[0]?.dueDate).toBe('2026-11-02');
  await card.getByRole('button', { name: 'Als erledigt markieren', exact: true }).click();
  await expect.poll(() => state.entries()[0]?.status).toBe('done');
  await page.reload();
  await page.locator('#view-workspace').click();
  await page.locator('#workspace-filter').selectOption('task-done');
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Wieder öffnen', exact: true }).click();
  await expect.poll(() => state.entries()[0]?.status).toBe('open');
  await page.locator('#workspace-filter').selectOption('task-open');
  await expect(card).toBeVisible();
});

test('record search and explicit 7/30/90 day ranges reveal the requested history', async ({ page }) => {
  const state = await workspaceFixture(page, [
    { date: today, entry: seededEntry('11111111-1111-4111-8111-111111111111', { title: 'Angebot heute' }) },
    { date: '2026-10-01', entry: seededEntry('33333333-3333-4333-8333-333333333333', { title: 'Angebot Anfang Oktober' }) },
    { date: '2026-08-20', entry: seededEntry('44444444-4444-4444-8444-444444444444', { title: 'Sommernotiz' }) },
  ]);
  await openWorkspace(page);
  await page.locator('#workspace-period').selectOption('7');
  await expect.poll(() => state.rangeRequests.at(-1)?.from).toBe('2026-10-22');
  await expect(page.locator('.workspace-card')).toHaveCount(1);
  await page.locator('#workspace-period').selectOption('30');
  await expect(page.locator('.workspace-card')).toHaveCount(2);
  await page.locator('#workspace-search').fill('anfang oktober');
  await expect(page.locator('.workspace-card')).toHaveCount(1);
  await expect(page.locator('.workspace-card')).toContainText('Angebot Anfang Oktober');
  await page.locator('#workspace-search').fill('');
  await page.locator('#workspace-period').selectOption('90');
  await expect(page.locator('.workspace-card')).toHaveCount(3);
  expect(state.rangeRequests.at(-1)?.to).toBe(today);
});

test('a conflict preserves the draft and another device record until explicit rebase', async ({ page }) => {
  const state = await workspaceFixture(page);
  await openWorkspace(page);
  await enterNote(page, 'Mein ungespeicherter Entwurf', 'SYNTHETIC_DRAFT_PRESERVE');
  state.conflictOnce();
  await page.locator('#workspace-save').click();
  await expect(page.locator('#workspace-rebase')).toBeVisible();
  await expect(page.locator('#workspace-note')).toHaveValue('SYNTHETIC_DRAFT_PRESERVE');
  expect(state.entries().map(entry => entry.title)).toEqual(['Auf anderem Gerät gespeichert']);
  await page.locator('#workspace-rebase').click();
  await page.locator('#workspace-save').click();
  await expect.poll(() => state.entries().length).toBe(2);
  expect(state.entries().some(entry => entry.title === 'Auf anderem Gerät gespeichert')).toBe(true);
  await expect(page.locator('.workspace-card').filter({ hasText: 'Mein ungespeicherter Entwurf' })).toBeVisible();
});

test('refreshing a clean open editor does not authorize overwriting another device change', async ({ page }) => {
  const id = '88888888-8888-4888-8888-888888888888';
  const state = await workspaceFixture(page, [{ date: today, entry: seededEntry(id, {
    title: 'Gemeinsam bearbeitete Notiz', note: 'Ursprünglicher Text im geöffneten Editor.',
  }) }]);
  await openWorkspace(page);
  const card = page.locator('.workspace-card').filter({ hasText: 'Gemeinsam bearbeitete Notiz' });
  await card.getByRole('button', { name: 'Bearbeiten', exact: true }).click();
  await expect(page.locator('#workspace-note')).toHaveValue('Ursprünglicher Text im geöffneten Editor.');
  state.updateExistingOnAnotherDevice(id, { note: 'Neuer Text vom anderen Gerät.' });
  await page.locator('#workspace-refresh').click();
  await expect(card).toContainText('Neuer Text vom anderen Gerät.');
  // This still-clean editor retains the revision of the text it actually shows.
  await expect(page.locator('#workspace-note')).toHaveValue('Ursprünglicher Text im geöffneten Editor.');
  await page.locator('#workspace-note').fill('Mein nun bearbeiteter lokaler Entwurf.');
  await page.locator('#workspace-save').click();
  await expect(page.locator('#workspace-rebase')).toBeVisible();
  expect(state.writes.at(-1)?.expectedRevision).toBe(1);
  expect(state.entries()[0]?.note).toBe('Neuer Text vom anderen Gerät.');
  await expect(page.locator('#workspace-note')).toHaveValue('Mein nun bearbeiteter lokaler Entwurf.');
  await page.locator('#workspace-rebase').click();
  await page.locator('#workspace-save').click();
  await expect.poll(() => state.entries()[0]?.note).toBe('Mein nun bearbeiteter lokaler Entwurf.');
  expect(state.writes.at(-1)?.expectedRevision).toBe(2);
  expect(state.entries()).toHaveLength(1);
});

test('explicitly reopening a clean editor uses the refreshed record text', async ({ page }) => {
  const id = '99999999-9999-4999-8999-999999999999';
  const state = await workspaceFixture(page, [{ date: today, entry: seededEntry(id, {
    title: 'Erneut geöffnete Notiz', note: 'Alter Text vor der Änderung.',
  }) }]);
  await openWorkspace(page);
  const card = page.locator('.workspace-card').filter({ hasText: 'Erneut geöffnete Notiz' });
  await card.getByRole('button', { name: 'Bearbeiten', exact: true }).click();
  state.updateExistingOnAnotherDevice(id, { note: 'Aktueller Text vom anderen Gerät.' });
  await page.locator('#workspace-refresh').click();
  await expect(card).toContainText('Aktueller Text vom anderen Gerät.');
  await card.getByRole('button', { name: 'Bearbeiten', exact: true }).click();
  await expect(page.locator('#workspace-note')).toHaveValue('Aktueller Text vom anderen Gerät.');
});

test('the daily context editor retains its original revision across a background refresh', async ({ page }) => {
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const state = await workspaceFixture(page, [{ date: today, entry: seededEntry(id, {
    title: 'Tagesnotiz im bestehenden Editor', note: 'Ursprüngliche Tagesnotiz.',
  }) }]);
  await openWorkspace(page);
  await page.locator('#view-day').click();
  const card = page.locator('#context-entry-list .context-entry').filter({ hasText: 'Tagesnotiz im bestehenden Editor' });
  await card.getByRole('button', { name: 'Bearbeiten', exact: true }).click();
  const note = page.locator('#context-form textarea[name="note"]');
  await expect(note).toHaveValue('Ursprüngliche Tagesnotiz.');
  state.updateExistingOnAnotherDevice(id, { note: 'Auf einem anderen Gerät geänderte Tagesnotiz.' });
  // The real app polls, and the daily context cache refreshes after sixty seconds.
  await page.clock.fastForward(61_000);
  await expect(card).toContainText('Auf einem anderen Gerät geänderte Tagesnotiz.');
  await expect(note).toHaveValue('Ursprüngliche Tagesnotiz.');
  await note.fill('Mein lokaler Tagesnotiz-Entwurf.');
  await page.locator('#context-save').click();
  await expect(page.locator('#context-rebase')).toBeVisible();
  expect(state.writes.at(-1)?.expectedRevision).toBe(1);
  expect(state.entries()[0]?.note).toBe('Auf einem anderen Gerät geänderte Tagesnotiz.');
  await expect(note).toHaveValue('Mein lokaler Tagesnotiz-Entwurf.');
});

test('a lost save response retries the same UUID without duplicating the note', async ({ page }) => {
  const state = await workspaceFixture(page);
  await openWorkspace(page);
  await enterNote(page, 'Nur einmal speichern', 'SYNTHETIC_UNCERTAIN_SAVE');
  state.loseResponseOnce();
  await page.locator('#workspace-save').click();
  await expect.poll(() => state.entries().length).toBe(1);
  await expect(page.locator('#workspace-save')).toBeEnabled();
  await expect(page.locator('#workspace-note')).toHaveValue('SYNTHETIC_UNCERTAIN_SAVE');
  await page.locator('#workspace-save').click();
  await expect(page.locator('#workspace-note')).toHaveValue('');
  expect(state.entries()).toHaveLength(1);
  expect(state.writes).toHaveLength(2);
  expect(state.writes[0].entry?.id).toBe(state.writes[1].entry?.id);
});

for (const width of [320, 390, 1440]) {
  test(`assistant workspace remains usable and treats saved markup as text at ${width}px`, async ({ page, browserName }) => {
    await page.setViewportSize({ width, height: 1000 });
    const hostile = '<img src=x onerror="window.workspaceInjected=true">';
    await workspaceFixture(page, [
      { date: today, entry: seededEntry('55555555-5555-4555-8555-555555555555', {
        title: 'Sichere Darstellung', note: hostile + ' ' + 'LangerTextOhneLeerzeichen'.repeat(20),
      }) },
      { date: today, entry: seededEntry('77777777-7777-4777-8777-777777777777', {
        kind: 'task', title: 'Synthetische Aufgabe: Angebot prüfen', status: 'open',
        dueDate: '2026-10-30', note: 'Fixture für die Prüfung auf Handy und Desktop.',
      }) },
    ]);
    await openWorkspace(page);
    const card = page.locator('.workspace-card').filter({ hasText: 'Sichere Darstellung' });
    await expect(card).toContainText(hostile);
    await expect(card.locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => 'workspaceInjected' in window)).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const button = await page.locator('#workspace-save').boundingBox();
    expect(button?.height).toBeGreaterThanOrEqual(44);
    const edit = await card.getByRole('button', { name: 'Bearbeiten', exact: true }).boundingBox();
    expect(edit?.height).toBeGreaterThanOrEqual(44);
    const screenshotName = width === 1440 ? 'desktop' : width === 390 ? 'mobile' : 'narrow';
    await page.screenshot({ path: `test-results/assistant-ui/${browserName}-${screenshotName}.png`, fullPage: true });
  });
}

test('locking removes saved private text, search results and unsaved draft from the DOM', async ({ page }) => {
  await workspaceFixture(page, [{ date: today, entry: seededEntry('66666666-6666-4666-8666-666666666666', {
    title: 'SYNTHETIC_PRIVATE_SAVED', note: 'Dieser Inhalt wird beim Sperren entfernt.',
  }) }]);
  await openWorkspace(page);
  await expect(page.locator('.workspace-card')).toContainText('SYNTHETIC_PRIVATE_SAVED');
  await enterNote(page, 'SYNTHETIC_PRIVATE_DRAFT', 'SYNTHETIC_PRIVATE_DRAFT_BODY');
  await page.locator('#logout').click();
  await expect(page.locator('body')).not.toContainText('SYNTHETIC_PRIVATE_SAVED');
  const values = await page.locator('input,textarea').evaluateAll(elements => elements.map(element => (element as HTMLInputElement).value).join('\n'));
  expect(values).not.toContain('SYNTHETIC_PRIVATE_DRAFT');
  expect(values).not.toContain('SYNTHETIC_PRIVATE_DRAFT_BODY');
  await expect(page.locator('#workspace-save')).toBeDisabled();
});
