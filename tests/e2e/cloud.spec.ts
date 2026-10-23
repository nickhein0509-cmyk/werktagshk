import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

const userId = '11111111-1111-4111-8111-111111111111';
const roundId = '22222222-2222-4222-8222-222222222222';
const guest = { version: 1, attempts: [], bookmarks: [], dailyGoal: 8 };
const baseSnapshot = (kind: string) => ({
  id: roundId,
  position: 0,
  total: 5,
  revision: 1,
  completed: false,
  question: {
    id: 'synthetic-question',
    version: 1,
    title: 'Synthetische Aufgabe',
    prompt: 'Nur ein isolierter Browser-Test.',
    kind,
    unit: 'kWh',
    options: [
      { id: 'a', label: 'Synthetische Auswahl A' },
      { id: 'b', label: 'Synthetische Auswahl B' },
    ],
  },
  draft: {},
  policy: {},
  answerSubmitted: false,
  solutionViewed: false,
});
async function fixture(
  page: Page,
  kind = 'numeric',
  conflict = false,
  withFigure = false,
  allowAids = true,
  catalogEntries?: Record<string, unknown>[],
) {
  let snapshot = {
    ...baseSnapshot(kind),
    question: {
      ...baseSnapshot(kind).question,
      figures: withFigure ? [{ assetId: 'synthetic-asset', alt: 'Synthetisches Testbild' }] : [],
    },
  };
  const submissions: Record<string, unknown>[] = [];
  await page.addInitScript(
    ({ userId, guest }) => {
      const token = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 }))}.synthetic`;
      localStorage.setItem(
        'werktag-learning-auth',
        JSON.stringify({
          access_token: token,
          refresh_token: 'synthetic-refresh-token',
          token_type: 'bearer',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: userId,
            email: 'fixture@example.invalid',
            aud: 'authenticated',
            role: 'authenticated',
          },
        }),
      );
      localStorage.setItem('werktag-learning-v1', JSON.stringify(guest));
    },
    { userId, guest },
  );
  const policy = () => ({
    validUntil: new Date(Date.now() + 5000).toISOString(),
    hints: allowAids,
    earlySolution: allowAids,
    feedback: true,
  });
  await page.route('https://test-werktag.supabase.co/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const args = route.request().postDataJSON() as Record<string, unknown> | null;
    let body: unknown = {};
    if (path.endsWith('/shk_learning_progress'))
      body = route.request().method() === 'GET' ? null : { revision: 1 };
    else if (path.endsWith('/shk_learning_data'))
      body = {
        rulesVersion: 'shk-levels/2',
        catalog: catalogEntries ?? [
          {
            id: 'synthetic-question',
            version: 1,
            topic: 'heizung',
            title: 'Synthetische Aufgabe',
            kind,
            active: true,
            reviewStatus: 'checked',
          },
        ],
        rounds: [{ id: roundId, topic: 'heizung', completed: false, attemptIds: [] }],
      };
    else if (path.endsWith('/shk_asset'))
      body = {
        contentType: 'image/png',
        base64:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1a8AAAAASUVORK5CYII=',
      };
    else if (path.endsWith('/shk_session_policy')) body = policy();
    else if (path.endsWith('/shk_load_session')) body = { ...snapshot, policy: policy() };
    else if (path.endsWith('/shk_help')) {
      snapshot = { ...snapshot, revision: 2, solutionViewed: true };
      body = { ...snapshot, solution: { model: 'Synthetischer Musterweg' }, policy: policy() };
    } else if (path.endsWith('/shk_submit')) {
      submissions.push(args!);
      if (conflict) {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'PT409', message: 'Anderes Gerät hat die Runde geändert.' }),
        });
        return;
      }
      snapshot = { ...snapshot, answerSubmitted: true, revision: 3 };
      body = {
        ...snapshot,
        policy: policy(),
        solution: { model: 'Synthetischer Musterweg' },
        feedback: { outcome: 'correct', message: 'Vom Server bewertet.' },
      };
    } else if (path.endsWith('/logout')) body = {};
    else throw Error(`Unexpected fixture request: ${path}`);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('button', { name: 'Mein Fragenbestand' })
    .click();
  await expect(page.getByRole('heading', { name: /Aufgabenverzeichnis/ })).toBeVisible();
  await page.getByRole('button', { name: /fortsetzen/ }).click();
  return submissions;
}

test('private numeric answers use server grading and leave guest progress intact', async ({
  page,
}) => {
  const submissions = await fixture(page);
  await expect(page.getByText('Synthetischer Musterweg')).toHaveCount(0);
  await page.getByLabel('Rechenergebnis', { exact: true }).fill('1,25');
  await page.getByRole('button', { name: 'Antwort abgeben', exact: true }).click();
  await expect(page.getByText('Vom Server bewertet.')).toBeVisible();
  expect(submissions).toHaveLength(1);
  expect(submissions[0]).toMatchObject({
    _session: roundId,
    _position: 0,
    _revision: 1,
    _answer: { text: '1,25', unit: 'kWh' },
  });
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('werktag-learning-v1')!)),
  ).toEqual(guest);
  await page.waitForTimeout(5500);
  await expect(page.getByText('Synthetischer Musterweg')).toBeVisible();
});

test('self assessment requires an explicit solution comparison', async ({ page }) => {
  const submissions = await fixture(page, 'self');
  await page.getByLabel('Deine Erklärung', { exact: true }).fill('Mein eigener Lösungsweg.');
  const comparison = page.getByLabel('Selbstvergleich nach der Musterlösung');
  await expect(comparison).toBeDisabled();
  await page.getByRole('button', { name: 'Musterlösung öffnen', exact: true }).click();
  await expect(page.getByText('Synthetischer Musterweg')).toBeVisible();
  await comparison.selectOption('partial');
  await page.getByRole('button', { name: 'Antwort abgeben', exact: true }).click();
  await expect(page.getByText('Vom Server bewertet.')).toBeVisible();
  expect(submissions[0]).toMatchObject({
    _revision: 2,
    _answer: { text: 'Mein eigener Lösungsweg.', selfAssessment: 'partial' },
  });
});

test('revision conflicts retain the entered answer and do not show fabricated success', async ({
  page,
}) => {
  await fixture(page, 'numeric', true);
  await page.getByLabel('Rechenergebnis', { exact: true }).fill('42');
  await page.getByRole('button', { name: 'Antwort abgeben', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Anderes Gerät');
  await expect(page.getByLabel('Rechenergebnis', { exact: true })).toHaveValue('42');
  await expect(page.getByText('Vom Server bewertet.')).toHaveCount(0);
});

test('sign-out removes private content and mobile cloud fields fit the viewport', async ({
  page,
}) => {
  await fixture(page);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
  await page.locator('.cloud-account summary').click();
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeVisible();
  await expect(page.getByText('Synthetische Aufgabe')).toHaveCount(0);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('werktag-learning-v1')!)),
  ).toEqual(guest);
});

test('reloading a question with the same raster figure keeps answer submission available', async ({
  page,
}) => {
  await fixture(page, 'numeric', false, true);
  const answer = page.getByRole('button', { name: 'Antwort abgeben', exact: true });
  await expect(page.getByRole('img', { name: 'Synthetisches Testbild' })).toBeVisible();
  await expect(answer).toBeEnabled();
  await page.getByRole('button', { name: 'Runde neu laden', exact: true }).click();
  await expect(answer).toBeEnabled();
});

test('private calculation work survives a round reload without being sent as an answer', async ({
  page,
}) => {
  const submissions = await fixture(page);
  const round = page.getByRole('region', { name: 'Laufende Lernrunde' });
  await round
    .getByRole('textbox', { name: 'Gegeben & gesucht', exact: true })
    .fill('m = 120 kg, gesucht Q');
  await round
    .getByRole('textbox', { name: 'Rechenweg', exact: true })
    .fill('Mein eigener Zwischenschritt');
  await round.getByRole('textbox', { name: 'Notizen', exact: true }).fill('Einheiten prüfen');
  await round.getByRole('button', { name: 'Runde neu laden', exact: true }).click();
  await expect(round.getByRole('textbox', { name: 'Rechenweg', exact: true })).toHaveValue(
    'Mein eigener Zwischenschritt',
  );
  await expect(round.getByRole('textbox', { name: 'Notizen', exact: true })).toHaveValue(
    'Einheiten prüfen',
  );
  await expect(round.getByText(/nicht im Konto gespeichert/)).toBeVisible();
  await round.getByLabel('Rechenergebnis', { exact: true }).fill('1,25');
  await round.getByRole('button', { name: 'Antwort abgeben', exact: true }).click();
  expect(submissions).toHaveLength(1);
  expect(submissions[0]._answer).toEqual({ text: '1,25', unit: 'kWh' });
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
});

test('private rounds do not expose the workpad or calculator without the current aid permission', async ({
  page,
}) => {
  await fixture(page, 'numeric', false, false, false);
  await expect(page.getByRole('textbox', { name: 'Gegeben & gesucht', exact: true })).toHaveCount(
    0,
  );
  await expect(page.locator('.calculation-workspace')).toHaveCount(0);
  await expect(page.getByText(/Nutze deinen eigenen Taschenrechner/)).toBeVisible();
  await page.getByLabel('Rechenergebnis', { exact: true }).fill('0,75');
  await page.getByRole('button', { name: 'Antwort abgeben', exact: true }).click();
  await expect(page.getByText('Vom Server bewertet.')).toBeVisible();
});

test('revoking private aid permission hides the workpad and restoring it retains local notes', async ({
  page,
}) => {
  await fixture(page);
  await page
    .getByRole('textbox', { name: 'Notizen', exact: true })
    .fill('Meine Notiz bleibt bei der Aufgabe.');
  let aidsAllowed = false;
  const currentPolicy = () => ({
    validUntil: new Date(Date.now() + 5000).toISOString(),
    hints: aidsAllowed,
    earlySolution: aidsAllowed,
    feedback: true,
  });
  await page.route('**/rest/v1/rpc/shk_session_policy', async (route) => {
    await route.fulfill({ json: currentPolicy() });
  });
  await page.route('**/rest/v1/rpc/shk_load_session', async (route) => {
    await route.fulfill({ json: { ...baseSnapshot('numeric'), policy: currentPolicy() } });
  });
  await page.getByRole('button', { name: 'Runde neu laden', exact: true }).click();
  await expect(page.locator('.calculation-workspace')).toHaveCount(0);
  aidsAllowed = true;
  await page.getByRole('button', { name: 'Runde neu laden', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Notizen', exact: true })).toHaveValue(
    'Meine Notiz bleibt bei der Aufgabe.',
  );
});

test('private directory distinguishes response types without changing the open round', async ({
  page,
}) => {
  await fixture(page, 'short');
  const directory = page.getByRole('region', { name: 'Aufgabenverzeichnis', exact: true });
  const kindFilter = page.getByRole('combobox', {
    name: 'Aufgabenart im Verzeichnis',
    exact: true,
  });
  await expect(directory.getByRole('article')).toHaveCount(1);
  await expect(
    directory.getByText('Heizung · Kontextaufgabe · Kurzantwort · Fassung 1'),
  ).toBeVisible();
  await kindFilter.selectOption('calculation');
  await expect(directory.getByRole('article')).toHaveCount(0);
  await expect(directory.getByText('Keine Aufgaben für diese Filter gefunden.')).toBeVisible();
  await expect(page.getByLabel('Deine Erklärung', { exact: true })).toBeVisible();
  await kindFilter.selectOption('context');
  await expect(directory.getByRole('article')).toHaveCount(1);
});

test('stored difficulty filters and sorts the private directory without changing the active question', async ({
  page,
}) => {
  const entry = {
    version: 1,
    topic: 'heizung',
    kind: 'numeric',
    active: true,
    reviewStatus: 'checked',
  };
  await fixture(page, 'numeric', false, false, true, [
    {
      ...entry,
      id: 'synthetic-question',
      title: 'Synthetische Aufgabe',
      difficulty: 'applied',
      demand: 'foundation',
    },
    {
      ...entry,
      id: 'synthetic-basic',
      title: 'Synthetische Basisfrage',
      difficulty: 'basic',
      demand: 'application',
    },
    { ...entry, id: 'synthetic-unknown', title: 'Synthetisch ohne Einstufung' },
    { ...entry, id: 'synthetic-latest', title: 'Synthetische alte Fassung', difficulty: 'basic' },
    {
      ...entry,
      id: 'synthetic-latest',
      title: 'Synthetische aktuelle Fassung',
      version: 2,
      topic: 'wiso',
      difficulty: 'applied',
    },
  ]);
  const directory = page.getByRole('region', { name: 'Aufgabenverzeichnis', exact: true });
  const round = page.getByRole('region', { name: 'Laufende Lernrunde', exact: true });
  await expect(directory.getByRole('article')).toHaveCount(4);
  await expect(round.locator('.cloud-difficulty-label')).toContainText(
    'Bestandsschwierigkeit: Anwendung',
  );
  await expect(round.locator('.cloud-difficulty-label')).toContainText(
    'Anforderungszuordnung: Grundlagen',
  );
  await page.getByText('Bestand einordnen · 4 aktuelle Aufgaben', { exact: true }).click();
  await expect(page.locator('.cloud-native-scale')).toContainText(
    '1 Basis · 2 Anwendung · 1 noch nicht eingestuft',
  );
  await expect(page.locator('.cloud-topic-counts')).toContainText('Heizung');
  await expect(page.locator('.cloud-topic-counts')).toContainText('Wirtschaft & Soziales');

  const sort = page.getByRole('combobox', { name: 'Verzeichnis sortieren', exact: true });
  await sort.selectOption('asc');
  await expect(directory.getByRole('article').first()).toContainText('Synthetische Basisfrage');
  await expect(directory.getByRole('article').last()).toContainText('Synthetisch ohne Einstufung');
  await sort.selectOption('desc');
  await expect(directory.getByRole('article').first()).toContainText('Synthetische Aufgabe');
  await expect(directory.getByRole('article').last()).toContainText('Synthetisch ohne Einstufung');
  const filter = page.getByRole('combobox', { name: 'Schwierigkeit im Verzeichnis', exact: true });
  await filter.selectOption('basic');
  await expect(directory.getByRole('article')).toHaveCount(1);
  await filter.selectOption('applied');
  await expect(directory.getByRole('article')).toHaveCount(2);
  await filter.selectOption('unknown');
  await expect(directory.getByRole('article')).toHaveCount(1);
  await expect(page.getByLabel('Rechenergebnis', { exact: true })).toBeVisible();
  await expect(
    round.getByRole('heading', { name: 'Synthetische Aufgabe', exact: true }),
  ).toBeVisible();
  await filter.selectOption('all');
  await page.setViewportSize({ width: 320, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(a11y.violations).toEqual([]);
});

test('a private question never borrows difficulty from another content revision', async ({
  page,
}) => {
  const entry = {
    version: 1,
    topic: 'heizung',
    kind: 'numeric',
    active: true,
    reviewStatus: 'checked',
  };
  await fixture(page, 'numeric', false, false, true, [
    { ...entry, id: 'synthetic-question', title: 'Synthetische Aufgabe', difficulty: 'applied' },
  ]);
  await page.route('**/rest/v1/rpc/shk_load_session', async (route) => {
    const snapshot = baseSnapshot('numeric');
    await route.fulfill({
      json: {
        ...snapshot,
        question: { ...snapshot.question, version: 2 },
        policy: { feedback: true, validUntil: new Date(Date.now() + 5000).toISOString() },
      },
    });
  });
  await page.getByRole('button', { name: 'Runde neu laden', exact: true }).click();
  const round = page.getByRole('region', { name: 'Laufende Lernrunde', exact: true });
  await expect(round.locator('.cloud-difficulty-label')).toHaveText(
    'Bestandsschwierigkeit: Noch nicht eingestuft',
  );
});
