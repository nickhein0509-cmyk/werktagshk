import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Page, Response } from '@playwright/test';

// Isolated synthetic fixtures. No real account, knowledge payload or learner event.
const fixtureUserId = '11111111-1111-4111-8111-111111111111';
const guestRecord = { version: 1, attempts: [], bookmarks: [], dailyGoal: 8 };
const articleTitle = 'Synthetischer Fachartikel Alpha';
const currentTermTitle = 'Synthetischer Begriff Beta';
const oldTermTitle = 'Historischer synthetischer Begriff';
const privateBody = 'PRIVATE_KNOWLEDGE_BODY_ALPHA';
const hiddenTitle = 'MASKED_CATALOG_TITLE_MARKER';
const hiddenSynonym = 'MASKED_CATALOG_SYNONYM_MARKER';
type Kind = 'article' | 'term';
type Args = Record<string, unknown>;
interface Metadata {
  kind: Kind;
  id: string;
  version: number;
  title: string;
  synonyms: string[];
  topicIds: string[];
  learningFieldIds: string[];
  masked: boolean;
}

function metadata(): Metadata[] {
  return [
    {
      kind: 'article',
      id: 'synthetic-article',
      version: 3,
      title: articleTitle,
      synonyms: ['Alpha-Synonym'],
      topicIds: ['heizung'],
      learningFieldIds: ['synthetic-lf-7'],
      masked: false,
    },
    {
      kind: 'term',
      id: 'synthetic-term',
      version: 2,
      title: currentTermTitle,
      synonyms: ['Beta-Synonym'],
      topicIds: ['trinkwasser'],
      learningFieldIds: ['synthetic-lf-8'],
      masked: false,
    },
    {
      kind: 'term',
      id: 'synthetic-masked',
      version: 1,
      title: hiddenTitle,
      synonyms: [hiddenSynonym],
      topicIds: ['heizung'],
      learningFieldIds: ['synthetic-lf-7'],
      masked: true,
    },
  ];
}

function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

interface FixtureState {
  items: Metadata[];
  epoch: string;
  knowledge: boolean;
  expiresAt?: number;
  catalogFails: boolean;
  readFailures: number;
  nextReadGate?: Promise<void>;
  nextCatalogReply?: { wait: Promise<void>; status: number };
  afterNextRead?: (args: Args) => void;
}

async function fixture(
  page: Page,
  options: {
    authenticated?: boolean;
    items?: Metadata[];
    expiresAt?: number;
  } = {},
) {
  const authenticated = options.authenticated !== false;
  const state: FixtureState = {
    items: options.items ?? metadata(),
    epoch: 'synthetic-knowledge-epoch-1',
    knowledge: true,
    expiresAt: options.expiresAt,
    catalogFails: false,
    readFailures: 0,
  };
  const catalogs: Args[] = [];
  const reads: Args[] = [];
  const unexpectedLearning: string[] = [];
  const privateRequests: string[] = [];
  const policy = () => ({
    epoch: state.epoch,
    knowledge: state.knowledge,
    validUntil: new Date(state.expiresAt ?? Date.now() + 60000).toISOString(),
  });
  function reading(args: Args) {
    const key = `${args._kind}:${args._id}:${args._version}`;
    const supported = [
      'article:synthetic-article:3',
      'term:synthetic-term:1',
      'term:synthetic-term:2',
      'term:synthetic-masked:1',
      'term:synthetic-related-only:1',
    ];
    if (!supported.includes(key)) throw Error(`Unexpected synthetic knowledge target: ${key}`);
    const isArticle = args._id === 'synthetic-article';
    const historical = args._id === 'synthetic-term' && args._version === 1;
    const item = state.items.find((item) => item.id === args._id) ?? {
      kind: 'term',
      id: 'synthetic-related-only',
      version: 1,
      title: 'Synthetischer zunächst unbekannter Verweis',
      synonyms: [],
      topicIds: ['heizung'],
      learningFieldIds: [],
      masked: false,
    };
    return {
      policy: policy(),
      entry: {
        ...item,
        kind: args._kind,
        id: args._id,
        version: args._version,
        title: historical ? oldTermTitle : item.title,
        masked: false,
        summary: isArticle ? privateBody : 'PRIVATE_KNOWLEDGE_BODY_TERM',
        details: {
          use: '### Synthetische Zwischenüberschrift\nSynthetischer erster Zusammenhang.\n\nSynthetischer zweiter Absatz mit einer Randbedingung.',
          example: isArticle
            ? 'Synthetisches durchgearbeitetes Beispiel mit nachvollziehbaren Einheiten.'
            : null,
          practice: 'Synthetischer Übungsimpuls ohne erfundene Lernleistung.',
          distinctions: ['Synthetische Abgrenzung zwischen Menge und Leistung.'],
          formulas: [
            {
              title: 'Synthetische Modellformel',
              text: 'Q = m × c × ΔT\nQ in kWh; Modellwerte sind ausdrücklich vorgegeben.',
            },
          ],
        },
        related: isArticle ? [{ kind: 'term', id: 'synthetic-term', version: 1 }] : [],
        sources: [
          {
            document: 'Synthetische Quellenangabe',
            pdfPage: 8,
            printedPage: '9',
            section: 'Synthetischer Abschnitt',
            note: 'Nur ein isolierter Testbeleg.',
          },
        ],
        review: { status: 'checked', checkedAt: '2026-10-23', openPoints: [] },
      },
    };
  }

  await page.addInitScript(
    ({ fixtureUserId, guestRecord, authenticated }) => {
      const writes: string[] = [];
      (window as unknown as { syntheticStorageWrites: string[] }).syntheticStorageWrites = writes;
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        writes.push(`${key}:${value}`);
        return setItem.call(this, key, value);
      };
      if (authenticated) {
        const token = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ sub: fixtureUserId, exp: Math.floor(Date.now() / 1000) + 3600 }))}.synthetic`;
        localStorage.setItem(
          'werktag-learning-auth',
          JSON.stringify({
            access_token: token,
            refresh_token: 'synthetic-refresh-token',
            token_type: 'bearer',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user: {
              id: fixtureUserId,
              email: 'knowledge-fixture@example.invalid',
              aud: 'authenticated',
              role: 'authenticated',
            },
          }),
        );
      }
      localStorage.setItem('werktag-learning-v1', JSON.stringify(guestRecord));
    },
    { fixtureUserId, guestRecord, authenticated },
  );
  await page.route('https://test-werktag.supabase.co/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const args = (route.request().postDataJSON() ?? {}) as Args;
    privateRequests.push(path);
    if (path.endsWith('/shk_knowledge_catalog')) {
      catalogs.push(args);
      const queued = state.nextCatalogReply;
      state.nextCatalogReply = undefined;
      const status = queued?.status ?? (state.catalogFails ? 503 : 200);
      const body = structuredClone({
        policy: policy(),
        items: state.items,
        learningFields: [
          {
            id: 'synthetic-lf-7',
            number: 7,
            title: 'Synthetisches Heizungslernfeld',
            competencies: 'Synthetische Kompetenzbeschreibung ohne Lernbewertung.',
          },
          {
            id: 'synthetic-lf-8',
            number: 8,
            title: 'Synthetisches Trinkwasserlernfeld',
            competencies: null,
          },
        ],
      });
      if (queued) await queued.wait;
      await route.fulfill({
        status,
        json: status >= 400 ? { message: 'SYNTHETIC_CATALOG_ERROR' } : body,
      });
      return;
    }
    if (path.endsWith('/shk_knowledge_read')) {
      reads.push(args);
      const wait = state.nextReadGate;
      state.nextReadGate = undefined;
      const afterRead = state.afterNextRead;
      state.afterNextRead = undefined;
      const body = structuredClone(reading(args));
      afterRead?.(args);
      if (wait) await wait;
      if (state.readFailures > 0) {
        state.readFailures--;
        await route.fulfill({
          status: 503,
          json: { message: 'SYNTHETIC_READ_RETRY' },
        });
      } else await route.fulfill({ json: body });
      return;
    }
    if (path.endsWith('/shk_learning_data')) {
      await route.fulfill({
        json: { rulesVersion: 'shk-levels/2', catalog: [], rounds: [] },
      });
      return;
    }
    if (path.endsWith('/shk_learning_progress')) {
      await route.fulfill({
        json: route.request().method() === 'GET' ? null : { revision: 1 },
      });
      return;
    }
    if (path.endsWith('/logout')) {
      await route.fulfill({ json: {} });
      return;
    }
    unexpectedLearning.push(path);
    await route.fulfill({
      status: 500,
      json: { message: 'Unexpected synthetic learning request.' },
    });
  });
  await page.goto('/');
  if (authenticated) {
    await page
      .getByRole('navigation', { name: 'Hauptnavigation' })
      .getByRole('button', { name: 'Mein Fragenbestand', exact: true })
      .click();
    await page.getByRole('button', { name: 'Fachwissen nachschlagen', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Wissensübersicht/ })).toBeVisible();
  }
  return { state, catalogs, reads, unexpectedLearning, privateRequests };
}

const knowledge = (page: Page) =>
  page.getByRole('region', { name: 'Privates Fachwissen', exact: true });
const openArticle = (page: Page) =>
  knowledge(page)
    .getByRole('button', { name: `Nachschlagen: ${articleTitle}`, exact: true })
    .click();
const refreshFocus = (page: Page) => page.evaluate(() => window.dispatchEvent(new Event('focus')));

async function settleReply(page: Page, pending: Promise<Response>) {
  await (await pending).finished();
  // Observe the post-response React state, not the DOM before a late callback ran.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

async function noPrivateStorage(page: Page) {
  const storage = await page.evaluate(() =>
    JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
      writes: (window as unknown as { syntheticStorageWrites: string[] }).syntheticStorageWrites,
    }),
  );
  for (const marker of [
    privateBody,
    'PRIVATE_KNOWLEDGE_BODY_TERM',
    articleTitle,
    currentTermTitle,
    oldTermTitle,
    hiddenTitle,
    hiddenSynonym,
  ])
    expect(storage).not.toContain(marker);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('werktag-learning-v1')!)),
  ).toEqual(guestRecord);
}

test('knowledge catalog search, topic, kind and learning-field filters remain read-only and hide masked search terms', async ({
  page,
}) => {
  const { catalogs, reads, unexpectedLearning } = await fixture(page);
  const view = knowledge(page);
  await expect(view.getByRole('heading', { name: 'Wissensübersicht (3)' })).toBeVisible();
  await expect(view.getByText(hiddenTitle, { exact: true })).toHaveCount(0);
  await expect(view.getByText(hiddenSynonym, { exact: true })).toHaveCount(0);
  await expect(view.getByText('Verknüpfter Wissenseintrag', { exact: true })).toBeVisible();
  const search = view.getByRole('searchbox', {
    name: 'Fachwissen durchsuchen',
  });
  for (const query of [hiddenTitle, hiddenSynonym]) {
    await search.fill(query);
    await expect(view.getByRole('heading', { name: 'Wissensübersicht (0)' })).toBeVisible();
  }
  await search.fill('Alpha-Synonym');
  await expect(view.getByRole('heading', { name: 'Wissensübersicht (1)' })).toBeVisible();
  await search.clear();
  await view.getByRole('combobox', { name: 'Thema', exact: true }).selectOption('heizung');
  await expect(view.getByRole('heading', { name: 'Wissensübersicht (2)' })).toBeVisible();
  await view.getByRole('combobox', { name: 'Inhalt', exact: true }).selectOption('article');
  await expect(view.getByRole('heading', { name: 'Wissensübersicht (1)' })).toBeVisible();
  await view
    .getByRole('combobox', { name: 'Lernfeld', exact: true })
    .selectOption('synthetic-lf-7');
  await view.getByText('Was dieses Lernfeld verbindet', { exact: true }).click();
  await expect(
    view.getByText('Synthetische Kompetenzbeschreibung ohne Lernbewertung.', {
      exact: true,
    }),
  ).toBeVisible();
  await view
    .getByRole('combobox', { name: 'Lernfeld', exact: true })
    .selectOption('synthetic-lf-8');
  await expect(view.getByRole('heading', { name: 'Wissensübersicht (0)' })).toBeVisible();
  expect(catalogs.length).toBeGreaterThan(0);
  expect(catalogs.every((args) => JSON.stringify(args) === JSON.stringify({ _filter: {} }))).toBe(
    true,
  );
  expect(reads).toEqual([]);
  expect(unexpectedLearning).toEqual([]);
  await expect(view.locator('.knowledge-reader')).toHaveCount(0);
  await noPrivateStorage(page);
});

test('explicit knowledge read retries the exact version idempotently and renders structured content plus historical related entries', async ({
  page,
}) => {
  const { state, reads, unexpectedLearning } = await fixture(page);
  state.readFailures = 1;
  await openArticle(page);
  await expect(knowledge(page).getByRole('alert')).toContainText('SYNTHETIC_READ_RETRY');
  await openArticle(page);
  const view = knowledge(page);
  const reader = view.locator('.knowledge-reader');
  await expect(reader.getByRole('heading', { name: articleTitle, exact: true })).toBeFocused();
  expect(reads).toHaveLength(2);
  expect(reads[0]).toMatchObject({
    _kind: 'article',
    _id: 'synthetic-article',
    _version: 3,
    _session: null,
    _position: null,
  });
  expect(String(reads[0]._request)).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  expect(reads[1]).toEqual(reads[0]);
  await expect(reader.getByText(privateBody, { exact: true })).toBeVisible();
  await expect(
    reader.getByRole('heading', {
      level: 4,
      name: 'Synthetische Zwischenüberschrift',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    reader.getByText('Synthetischer erster Zusammenhang.', { exact: true }),
  ).toBeVisible();
  await expect(
    reader.getByText('Synthetischer zweiter Absatz mit einer Randbedingung.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    reader.getByRole('heading', {
      name: 'Synthetische Modellformel',
      exact: true,
    }),
  ).toBeVisible();
  await expect(reader.getByText(/Q = m × c × ΔT/)).toBeVisible();
  await expect(
    reader.getByText('Synthetisches durchgearbeitetes Beispiel mit nachvollziehbaren Einheiten.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    reader.getByText('Synthetische Abgrenzung zwischen Menge und Leistung.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    reader.getByText('Synthetischer Übungsimpuls ohne erfundene Lernleistung.', { exact: true }),
  ).toBeVisible();
  await reader.getByText('Quellen und gespeicherter Prüfstand', { exact: true }).click();
  await expect(
    reader.getByText(
      /Synthetische Quellenangabe · PDF-Seite 8 · Druckseite 9 · Synthetischer Abschnitt/,
    ),
  ).toBeVisible();
  await reader.getByRole('button', { name: /Zur Wissensübersicht/ }).click();
  await expect(
    view.getByRole('button', {
      name: `Nachschlagen: ${articleTitle}`,
      exact: true,
    }),
  ).toBeFocused();
  await openArticle(page);
  await reader
    .getByRole('button', {
      name: `${currentTermTitle} · Fassung 1`,
      exact: true,
    })
    .click();
  expect(reads.at(-1)).toMatchObject({
    _kind: 'term',
    _id: 'synthetic-term',
    _version: 1,
  });
  await expect(reader.getByRole('heading', { name: oldTermTitle, exact: true })).toBeFocused();
  await expect(
    reader.getByRole('heading', {
      name: 'Durchgearbeitetes Beispiel',
      exact: true,
    }),
  ).toHaveCount(0);
  await reader.getByRole('button', { name: /Zur Wissensübersicht/ }).click();
  await expect(
    view.getByRole('heading', { name: 'Wissensübersicht (3)', exact: true }),
  ).toBeFocused();
  expect(unexpectedLearning).toEqual([]);
  await noPrivateStorage(page);
});

test('knowledge policy expiry clears the reader without automatically reading again', async ({
  page,
}) => {
  await page.clock.install({ time: new Date() });
  const { reads, unexpectedLearning } = await fixture(page, {
    expiresAt: Date.now() + 45000,
  });
  await openArticle(page);
  await expect(knowledge(page).getByText(privateBody, { exact: true })).toBeVisible();
  expect(reads).toHaveLength(1);
  await page.clock.fastForward(46000);
  await expect(knowledge(page).locator('.knowledge-reader')).toHaveCount(0);
  await expect(knowledge(page).getByText(privateBody, { exact: true })).toHaveCount(0);
  await expect(
    knowledge(page).getByRole('button', {
      name: 'Fachwissen neu laden',
      exact: true,
    }),
  ).toBeVisible();
  expect(reads).toHaveLength(1);
  expect(unexpectedLearning).toEqual([]);
  await noPrivateStorage(page);
});

test('catalog failure, a new mask and withdrawn permission close the reader without reopening it', async ({
  page,
}) => {
  const { state, reads, unexpectedLearning } = await fixture(page);
  const view = knowledge(page);
  await openArticle(page);
  await expect(view.getByText(privateBody, { exact: true })).toBeVisible();
  state.catalogFails = true;
  await refreshFocus(page);
  await expect(view.getByRole('alert')).toContainText('SYNTHETIC_CATALOG_ERROR');
  await expect(view.getByText(privateBody, { exact: true })).toHaveCount(0);
  expect(reads).toHaveLength(1);
  state.catalogFails = false;
  await view.getByRole('button', { name: 'Fachwissen neu laden', exact: true }).click();
  await expect(view.getByRole('heading', { name: /Wissensübersicht/ })).toBeVisible();
  expect(reads).toHaveLength(1);
  await openArticle(page);
  await expect(view.getByText(privateBody, { exact: true })).toBeVisible();
  state.items[0].masked = true;
  await refreshFocus(page);
  await expect(view.locator('.knowledge-reader')).toHaveCount(0);
  await expect(view.getByRole('heading', { name: articleTitle, exact: true })).toHaveCount(0);
  expect(reads).toHaveLength(2);
  state.knowledge = false;
  await refreshFocus(page);
  await expect(
    view.getByRole('button', { name: 'Fachwissen neu laden', exact: true }),
  ).toBeVisible();
  expect(reads).toHaveLength(2);
  expect(unexpectedLearning).toEqual([]);
  await noPrivateStorage(page);
});

test('blur invalidates an in-flight knowledge response and logout removes all private knowledge without storage', async ({
  page,
}) => {
  const { state, reads, unexpectedLearning } = await fixture(page);
  const deferred = gate();
  state.nextReadGate = deferred.promise;
  await openArticle(page);
  await expect.poll(() => reads.length).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(knowledge(page).locator('.knowledge-reader')).toHaveCount(0);
  const response = page.waitForResponse((response) =>
    response.url().endsWith('/shk_knowledge_read'),
  );
  deferred.release();
  await settleReply(page, response);
  await expect(knowledge(page).getByText(/Nach einem Fensterwechsel/)).toBeVisible();
  await expect(knowledge(page).getByText(privateBody, { exact: true })).toHaveCount(0);
  await refreshFocus(page);
  await expect(knowledge(page).getByRole('heading', { name: /Wissensübersicht/ })).toBeVisible();
  expect(reads).toHaveLength(1);
  await openArticle(page);
  await expect(knowledge(page).getByText(privateBody, { exact: true })).toBeVisible();
  expect(reads).toHaveLength(2);
  expect(reads[1]._request).toBe(reads[0]._request);
  await noPrivateStorage(page);
  await page.locator('.cloud-account summary').click();
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeVisible();
  await expect(knowledge(page)).toHaveCount(0);
  await expect(page.getByText(privateBody, { exact: true })).toHaveCount(0);
  expect(unexpectedLearning).toEqual([]);
  await noPrivateStorage(page);
});

test('a new mask between read and fresh catalog requires a conscious retry with the same request UUID', async ({
  page,
}) => {
  const { state, reads, unexpectedLearning } = await fixture(page, {
    items: [metadata()[0]],
  });
  state.afterNextRead = () => {
    state.items[0].masked = true;
  };
  await openArticle(page);
  const view = knowledge(page);
  await expect(view.getByRole('alert')).toContainText(/erneut bewusst als Hilfe/);
  await expect(view.getByText(privateBody, { exact: true })).toHaveCount(0);
  await expect(view.getByRole('heading', { name: articleTitle, exact: true })).toHaveCount(0);
  expect(reads).toHaveLength(1);
  await view
    .getByRole('button', {
      name: 'Nachschlagen: Verknüpfter Wissenseintrag',
      exact: true,
    })
    .click();
  await expect(view.getByText(privateBody, { exact: true })).toBeVisible();
  expect(reads).toHaveLength(2);
  expect(reads[1]).toEqual(reads[0]);
  expect(unexpectedLearning).toEqual([]);
  await noPrivateStorage(page);
});

test('a related target with previously unknown masking cannot silently open after it becomes masked', async ({
  page,
}) => {
  const { state, reads } = await fixture(page, { items: [metadata()[0]] });
  // Related target exists in the read contract, but is absent from catalog metadata.
  // The normal article's historical term link exercises that absence without a fake UI hook.
  await openArticle(page);
  const view = knowledge(page);
  await expect(view.getByText(privateBody, { exact: true })).toBeVisible();
  state.afterNextRead = () => {
    state.items.push({ ...metadata()[1], masked: true });
  };
  await view.getByRole('button', { name: 'Begriff · Fassung 1', exact: true }).click();
  await expect(view.locator('.knowledge-reader')).toHaveCount(0);
  await expect(view.getByRole('alert')).toContainText(/erneut bewusst als Hilfe/);
  await expect(view.getByText('PRIVATE_KNOWLEDGE_BODY_TERM', { exact: true })).toHaveCount(0);
  expect(reads).toHaveLength(2);
  await noPrivateStorage(page);
});

test('an old catalog error cannot erase a newer valid reader after blur and explicit reload', async ({
  page,
}) => {
  const { state, catalogs, reads } = await fixture(page);
  const oldFailure = gate();
  state.nextCatalogReply = { wait: oldFailure.promise, status: 503 };
  const callsBefore = catalogs.length;
  await refreshFocus(page);
  await expect.poll(() => catalogs.length).toBeGreaterThan(callsBefore);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await knowledge(page).getByRole('button', { name: 'Fachwissen neu laden', exact: true }).click();
  await expect(knowledge(page).getByRole('heading', { name: /Wissensübersicht/ })).toBeVisible();
  await openArticle(page);
  await expect(knowledge(page).getByText(privateBody, { exact: true })).toBeVisible();
  const staleResponse = page.waitForResponse(
    (response) => response.url().endsWith('/shk_knowledge_catalog') && response.status() === 503,
  );
  oldFailure.release();
  await settleReply(page, staleResponse);
  await expect(knowledge(page).getByText(privateBody, { exact: true })).toBeVisible();
  await expect(knowledge(page).getByRole('alert')).toHaveCount(0);
  expect(reads).toHaveLength(1);
  await noPrivateStorage(page);
});

test('guest library knowledge entry never fetches private knowledge or starts a learning event', async ({
  page,
}) => {
  const { reads, catalogs, privateRequests, unexpectedLearning } = await fixture(page, {
    authenticated: false,
  });
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('button', { name: 'Lernwerkstatt', exact: true })
    .click();
  await page
    .getByRole('button', {
      name: 'Fachwissen im Lernkonto nachschlagen',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Fachwissen', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeVisible();
  await expect(knowledge(page)).toHaveCount(0);
  expect(catalogs).toEqual([]);
  expect(reads).toEqual([]);
  expect(privateRequests).toEqual([]);
  expect(unexpectedLearning).toEqual([]);
  await noPrivateStorage(page);
});

test('reading knowledge marks an open model examination as assisted without changing its work or creating attempts', async ({
  page,
}) => {
  const { reads, unexpectedLearning } = await fixture(page);
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
  await navigation.getByRole('button', { name: 'Prüfungsbereich', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Aufgabenart', exact: true })
    .selectOption('calculation');
  await page.getByRole('switch', { name: 'Prüfungsmodus', exact: true }).click();
  await page.getByRole('button', { name: 'Runde starten', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Freier Rechenweg', exact: true })
    .fill('Synthetischer eigener Rechenentwurf vor dem Nachschlagen.');
  const key = `werktag-exam-session-v1:${fixtureUserId}`;
  const before = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)!), key);
  expect(before.examMode).toBe(true);
  expect(before.usedLearningMode).toBe(false);
  await navigation.getByRole('button', { name: 'Mein Fragenbestand', exact: true }).click();
  await page.getByRole('button', { name: 'Fachwissen nachschlagen', exact: true }).click();
  await expect(knowledge(page).getByRole('heading', { name: /Wissensübersicht/ })).toBeVisible();
  expect(reads).toHaveLength(0);
  expect(
    await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)!).usedLearningMode, key),
  ).toBe(false);
  await openArticle(page);
  await expect(knowledge(page).getByText(privateBody, { exact: true })).toBeVisible();
  await navigation.getByRole('button', { name: 'Prüfungsbereich', exact: true }).click();
  await expect(page.locator('.exam-round-status')).toContainText('Übungsrunde');
  const after = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)!), key);
  expect(after).toEqual({ ...before, usedLearningMode: true });
  expect(reads).toHaveLength(1);
  expect(unexpectedLearning).toEqual([]);
  await noPrivateStorage(page);
});

test('knowledge filters and full structured reader fit 320px and expose accessible controls', async ({
  page,
}) => {
  await fixture(page);
  await page.setViewportSize({ width: 320, height: 1000 });
  const view = knowledge(page);
  const kind = view.getByRole('combobox', { name: 'Inhalt', exact: true });
  await kind.evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await kind.click();
  await page.keyboard.press('Escape');
  await kind.selectOption('article');
  await expect(
    view.getByRole('heading', { name: 'Wissensübersicht (1)', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
  await openArticle(page);
  await expect(view.getByRole('heading', { name: articleTitle, exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
  await noPrivateStorage(page);
});
