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
  options: {
    autoContinue?: boolean;
    questionReview?: Record<string, unknown>;
    beginFailures?: number;
  } = {},
) {
  let snapshot = {
    ...baseSnapshot(kind),
    question: {
      ...baseSnapshot(kind).question,
      editorialReview: options.questionReview,
      figures: withFigure ? [{ assetId: 'synthetic-asset', alt: 'Synthetisches Testbild' }] : [],
    },
  };
  const submissions: Record<string, unknown>[] = [];
  const starts: Record<string, unknown>[] = [];
  let remainingBeginFailures = options.beginFailures ?? 0;
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
    else if (path.endsWith('/shk_begin_learning')) {
      starts.push(args!);
      if (remainingBeginFailures-- > 0) {
        await route.fulfill({
          status: 503,
          json: { message: 'Synthetischer vorübergehender Startfehler.' },
        });
        return;
      }
      const selection = args!._selection as Record<string, unknown>;
      const entry = catalogEntries?.find((entry) => {
        const review = entry.editorialReview as Record<string, unknown> | undefined;
        return (
          entry.active !== false &&
          !entry.excludedReason &&
          review?.practiceEligible !== false &&
          (!selection.questionId ||
            (selection.questionId === entry.id && selection.questionVersion === entry.version)) &&
          (!selection.topic || selection.topic === entry.topic) &&
          (!selection.difficultyLevel || selection.difficultyLevel === review?.difficultyLevel) &&
          (!selection.taskKind || selection.taskKind === review?.taskKind) &&
          (!selection.bankDifficulty || selection.bankDifficulty === entry.difficulty)
        );
      });
      snapshot = {
        ...snapshot,
        total: selection.questionId ? 1 : 5,
        question: {
          ...snapshot.question,
          ...(entry ?? {}),
          editorialReview: entry?.editorialReview as Record<string, unknown> | undefined,
        },
      };
      body = { ...snapshot, policy: policy() };
    } else if (path.endsWith('/shk_asset'))
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
  if (options.autoContinue !== false)
    await page.getByRole('button', { name: /fortsetzen/ }).click();
  return { submissions, starts };
}

test('private numeric answers use server grading and leave guest progress intact', async ({
  page,
}) => {
  const { submissions } = await fixture(page);
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
  const { submissions } = await fixture(page, 'self');
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
  await page.route('**/assistenz/logout', route => route.fulfill({ json: { ok: true } }));
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

for (const failure of ['http', 'network'] as const) {
  test(`sign-out waits for private session revocation after a ${failure} failure`, async ({ page }) => {
    await fixture(page);
    let revokeFails = true;
    let accountSignOuts = 0;
    const events: string[] = [];
    await page.route('**/assistenz/logout', async route => {
      events.push('private:revoke');
      if (revokeFails) {
        if (failure === 'network') return route.abort('failed');
        return route.fulfill({ status: 503, json: { error: 'Synthetischer Fehler' } });
      }
      events.push('private:revoked');
      return route.fulfill({ json: { ok: true } });
    });
    await page.route('https://test-werktag.supabase.co/auth/v1/logout**', async route => {
      accountSignOuts++;
      events.push('account:signout');
      await route.fulfill({ json: {} });
    });
    await page.locator('.cloud-account summary').click();
    const signOut = page.getByRole('button', { name: 'Abmelden', exact: true });
    await signOut.click();
    await expect(page.getByText('Abmelden nicht abgeschlossen. Bitte erneut versuchen.', { exact: true })).toBeVisible();
    await expect(signOut).toBeEnabled();
    expect(accountSignOuts).toBe(0);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('werktag-learning-auth')!).user.id)).toBe(userId);

    revokeFails = false;
    await signOut.click();
    await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeVisible();
    expect(accountSignOuts).toBe(1);
    expect(events.indexOf('private:revoked')).toBeLessThan(events.indexOf('account:signout'));
    expect(await page.evaluate(() => localStorage.getItem('werktag-learning-auth'))).toBeNull();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('werktag-learning-v1')!))).toEqual(guest);
  });
}

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
  const { submissions } = await fixture(page);
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

test('a missing task review stays unknown without changing the open round', async ({ page }) => {
  const { starts, submissions } = await fixture(page, 'short');
  const directory = page.getByRole('region', { name: 'Aufgabenverzeichnis', exact: true });
  const kindFilter = page.getByRole('combobox', {
    name: 'Aufgabenart',
    exact: true,
  });
  await expect(directory.getByRole('article')).toHaveCount(1);
  await expect(
    directory.getByText('Heizung · Aufgabenart offen · Kurzantwort · Fassung 1'),
  ).toBeVisible();
  await kindFilter.selectOption('calculation');
  await expect(directory.getByRole('article')).toHaveCount(0);
  await expect(directory.getByText('Keine Aufgaben für diese Filter gefunden.')).toBeVisible();
  await expect(page.getByLabel('Deine Erklärung', { exact: true })).toBeVisible();
  await kindFilter.selectOption('unknown');
  await expect(directory.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Gefilterte Runde starten' })).toBeDisabled();
  expect(starts).toEqual([]);
  expect(submissions).toEqual([]);
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

  await page.getByText('Zusätzliche Bestandskategorie', { exact: true }).click();
  const filter = page.getByRole('combobox', { name: 'Bestandseinstufung', exact: true });
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

const editorial = (
  difficultyLevel: 1 | 2 | 3 | 4,
  taskKind: 'calculation' | 'context' | 'knowledge',
  status = 'supported',
  practiceEligible = true,
) => ({
  difficultyLevel,
  taskKind,
  status,
  practiceEligible,
  reviewedAt: '2026-10-23',
  rubricVersion: 'werktag-demand/1',
});

function reviewedCatalog() {
  const entry = {
    version: 1,
    topic: 'heizung',
    kind: 'choice',
    active: true,
    reviewStatus: 'checked',
    difficulty: 'basic',
  };
  return [
    {
      ...entry,
      id: 'synthetic-calculation-choice',
      title: 'Synthetische Rechnung mit Auswahl',
      editorialReview: {
        ...editorial(1, 'calculation'),
        reason: 'SYNTHETIC_INTERNAL_REVIEW_NOT_FOR_LEARNERS',
      },
    },
    {
      ...entry,
      id: 'synthetic-context',
      title: 'Synthetischer Kontext',
      kind: 'self',
      editorialReview: editorial(2, 'context', 'qualified'),
    },
    {
      ...entry,
      id: 'synthetic-knowledge',
      title: 'Synthetisches Wissen',
      difficulty: 'applied',
      editorialReview: editorial(3, 'knowledge'),
    },
    {
      ...entry,
      id: 'synthetic-networked',
      title: 'Synthetische vernetzte Rechnung',
      kind: 'numeric',
      difficulty: 'applied',
      editorialReview: editorial(4, 'calculation'),
    },
    {
      ...entry,
      id: 'synthetic-unrated',
      title: 'Synthetisch ohne Einzelreview',
      kind: 'short',
      difficulty: undefined,
    },
    {
      ...entry,
      id: 'synthetic-blocked',
      title: 'Synthetisch noch nicht freigegeben',
      editorialReview: editorial(2, 'context', 'needs_revision', false),
    },
    {
      ...entry,
      id: 'synthetic-excluded',
      title: 'Synthetisch ausgeschlossen',
      excludedReason: 'Synthetische Abbildung fehlt.',
      editorialReview: editorial(2, 'context'),
    },
    {
      ...entry,
      id: 'synthetic-inactive',
      title: 'Synthetisch nicht mehr aktiv',
      active: false,
      difficulty: 'applied',
      editorialReview: editorial(3, 'knowledge'),
    },
    {
      ...entry,
      id: 'synthetic-versioned',
      title: 'Synthetische frühere Fassung',
      active: false,
      editorialReview: editorial(4, 'context'),
    },
    {
      ...entry,
      id: 'synthetic-versioned',
      title: 'Synthetische aktuelle Fassung',
      version: 2,
      editorialReview: editorial(1, 'knowledge'),
    },
  ];
}

test('four reviewed levels and real task kinds filter the directory without starting learning', async ({
  page,
}) => {
  const { starts, submissions } = await fixture(
    page,
    'choice',
    false,
    false,
    true,
    reviewedCatalog(),
    { autoContinue: false },
  );
  const directory = page.getByRole('region', { name: 'Aufgabenverzeichnis', exact: true });
  const level = page.getByRole('combobox', { name: 'Stufe', exact: true });
  const kind = page.getByRole('combobox', { name: 'Aufgabenart', exact: true });
  await expect(directory.getByRole('article')).toHaveCount(9);
  await expect(directory.getByRole('article').first()).toContainText('Stufe 1 · Einstieg');
  await expect(directory.getByRole('article').last()).toContainText('Stufe noch nicht eingestuft');
  await expect(directory.getByText('Synthetische frühere Fassung')).toHaveCount(0);
  for (const [value, count] of [
    ['1', 2],
    ['2', 3],
    ['3', 2],
    ['4', 1],
    ['unknown', 1],
  ] as const) {
    await level.selectOption(value);
    await expect(directory.getByRole('article')).toHaveCount(count);
  }
  await expect(page.getByRole('button', { name: 'Gefilterte Runde starten' })).toBeDisabled();
  await level.selectOption('all');
  for (const [value, count] of [
    ['calculation', 2],
    ['context', 3],
    ['knowledge', 3],
    ['unknown', 1],
  ] as const) {
    await kind.selectOption(value);
    await expect(directory.getByRole('article')).toHaveCount(count);
  }
  await kind.selectOption('calculation');
  await expect(directory.getByText(/Rechenaufgabe · Auswahlfrage/)).toBeVisible();
  await kind.selectOption('all');
  await page.getByRole('combobox', { name: 'Verzeichnis sortieren' }).selectOption('desc');
  await expect(directory.getByRole('article').first()).toContainText('Stufe 4 · Vernetzt');
  await expect(directory.getByRole('article').last()).toContainText('Stufe noch nicht eingestuft');
  await expect(page.getByText('SYNTHETIC_INTERNAL_REVIEW_NOT_FOR_LEARNERS')).toHaveCount(0);
  await expect(
    directory.getByRole('article').filter({ hasText: 'Synthetischer Kontext' }),
  ).toContainText('Beleg/Präzisierung offen');
  await page.getByText('Zusätzliche Bestandskategorie', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Bestandseinstufung' }).selectOption('basic');
  await expect(directory.getByRole('article')).toHaveCount(5);
  await page.getByRole('combobox', { name: 'Bestandseinstufung' }).selectOption('unknown');
  await expect(directory.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Gefilterte Runde starten' })).toBeDisabled();
  expect(starts).toEqual([]);
  expect(submissions).toEqual([]);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('werktag-learning-v1')!)),
  ).toEqual(guest);
});

test('direct start pins the selected version and opens a workpad for a calculation with choices', async ({
  page,
}) => {
  const { starts, submissions } = await fixture(
    page,
    'choice',
    false,
    false,
    true,
    reviewedCatalog(),
    { autoContinue: false },
  );
  await page
    .getByRole('button', { name: 'Aufgabe üben: Synthetische Rechnung mit Auswahl', exact: true })
    .click();
  expect(starts).toHaveLength(1);
  expect(starts[0]._selection).toEqual({
    mode: 'practice',
    questionId: 'synthetic-calculation-choice',
    questionVersion: 1,
    topic: 'heizung',
  });
  const round = page.getByRole('region', { name: 'Laufende Lernrunde' });
  await expect(round.getByRole('heading', { name: 'Aufgabe 1 von 1' })).toBeFocused();
  await expect(
    round.getByRole('textbox', { name: 'Gegeben & gesucht', exact: true }),
  ).toBeVisible();
  await expect(round.getByRole('radio')).toHaveCount(2);
  await expect(round.getByLabel('Rechenergebnis', { exact: true })).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Aufgabe üben: Synthetische aktuelle Fassung', exact: true })
    .click();
  expect(starts[1]._selection).toMatchObject({
    questionId: 'synthetic-versioned',
    questionVersion: 2,
  });
  expect(starts[1]._request).not.toBe(starts[0]._request);
  await expect(round.locator('.calculation-workspace')).toHaveCount(0);
  expect(submissions).toEqual([]);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('werktag-learning-v1')!)),
  ).toEqual(guest);
});

test('blocked versions explain disabled starts and the directory fits 320px with accessible controls', async ({
  page,
}) => {
  const { starts } = await fixture(page, 'choice', false, false, true, reviewedCatalog(), {
    autoContinue: false,
  });
  const directory = page.getByRole('region', { name: 'Aufgabenverzeichnis', exact: true });
  for (const title of [
    'Synthetisch noch nicht freigegeben',
    'Synthetisch ausgeschlossen',
    'Synthetisch nicht mehr aktiv',
  ]) {
    await expect(
      page.getByRole('button', { name: `Aufgabe üben: ${title}`, exact: true }),
    ).toBeDisabled();
  }
  await expect(directory).toContainText('Diese Fassung ist noch nicht zum Üben freigegeben.');
  await expect(directory).toContainText('Derzeit ausgeschlossen: Synthetische Abbildung fehlt.');
  await expect(directory).toContainText('Diese Fassung ist nicht mehr aktiv.');
  await page.setViewportSize({ width: 320, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
  expect(starts).toEqual([]);
});

test('filtered round sends only round criteria and retries the same exact selection idempotently', async ({
  page,
}) => {
  const { starts, submissions } = await fixture(
    page,
    'choice',
    false,
    false,
    true,
    reviewedCatalog(),
    { autoContinue: false, beginFailures: 1 },
  );
  await page.getByRole('combobox', { name: 'Thema', exact: true }).selectOption('heizung');
  await page.getByRole('combobox', { name: 'Stufe', exact: true }).selectOption('2');
  await page.getByRole('combobox', { name: 'Aufgabenart', exact: true }).selectOption('context');
  await page.getByText('Zusätzliche Bestandskategorie', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Bestandseinstufung' }).selectOption('basic');
  await page.getByRole('searchbox', { name: 'Fragen durchsuchen' }).fill('Kein Verzeichnistreffer');
  await page.getByRole('combobox', { name: 'Verzeichnis sortieren' }).selectOption('desc');
  const begin = page.getByRole('button', { name: 'Gefilterte Runde starten', exact: true });
  expect(starts).toEqual([]);
  await begin.click();
  await expect(page.getByRole('alert')).toContainText('Synthetischer vorübergehender Startfehler');
  await begin.click();
  await expect(page.getByRole('region', { name: 'Laufende Lernrunde' })).toBeVisible();
  expect(starts).toHaveLength(2);
  expect(starts[0]._selection).toEqual({
    mode: 'practice',
    topic: 'heizung',
    difficultyLevel: 2,
    taskKind: 'context',
    bankDifficulty: 'basic',
  });
  expect(starts[1]).toEqual(starts[0]);
  await page.getByRole('combobox', { name: 'Stufe', exact: true }).selectOption('4');
  await page
    .getByRole('combobox', { name: 'Aufgabenart', exact: true })
    .selectOption('calculation');
  await page.getByRole('combobox', { name: 'Bestandseinstufung' }).selectOption('applied');
  await begin.click();
  await expect(page.getByRole('region', { name: 'Laufende Lernrunde' })).toContainText(
    'Synthetische vernetzte Rechnung',
  );
  expect(starts[2]._selection).toMatchObject({
    difficultyLevel: 4,
    taskKind: 'calculation',
    bankDifficulty: 'applied',
  });
  expect(starts[2]._request).not.toBe(starts[1]._request);
  expect(submissions).toEqual([]);
});

test('active task classification uses its own version and never a newer catalog review', async ({
  page,
}) => {
  await fixture(
    page,
    'choice',
    false,
    false,
    true,
    [
      {
        id: 'synthetic-question',
        version: 2,
        topic: 'heizung',
        title: 'Synthetische neue Fassung',
        kind: 'choice',
        active: true,
        reviewStatus: 'checked',
        editorialReview: editorial(4, 'calculation'),
      },
    ],
    { questionReview: editorial(1, 'knowledge', 'qualified') },
  );
  const round = page.getByRole('region', { name: 'Laufende Lernrunde' });
  await expect(round).toContainText('Wissensfrage · Auswahlfrage · Fassung 1');
  await expect(round.locator('.cloud-editorial-label')).toContainText('Stufe 1 · Einstieg');
  await expect(round.locator('.cloud-editorial-label')).toContainText('Beleg/Präzisierung offen');
  await expect(round.locator('.calculation-workspace')).toHaveCount(0);
  await page.route('**/rest/v1/rpc/shk_load_session', async (route) => {
    await route.fulfill({
      json: {
        ...baseSnapshot('choice'),
        policy: {
          hints: true,
          feedback: true,
          validUntil: new Date(Date.now() + 5000).toISOString(),
        },
      },
    });
  });
  await round.getByRole('button', { name: 'Runde neu laden', exact: true }).click();
  await expect(round.locator('.cloud-editorial-label')).toHaveText('Stufe noch nicht eingestuft');
  await expect(round).toContainText('Aufgabenart offen · Auswahlfrage · Fassung 1');
  await expect(round.locator('.calculation-workspace')).toHaveCount(0);
});
