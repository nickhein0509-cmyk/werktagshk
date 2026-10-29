import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { exercises } from '../../src/data';

const userId = '33333333-3333-4333-8333-333333333333';
const storageKey = `werktag-learning-v1:${userId}`;
const remote = {
  version: 1,
  attempts: [
    {
      id: 'synthetic-preserved-attempt',
      exerciseId: exercises[0].id,
      answer: exercises[0].correctIndex,
      correct: true,
      answeredAt: '2026-10-23T12:00:00.000Z',
    },
  ],
  bookmarks: [exercises[0].id],
  dailyGoal: 5,
};

async function progressFixture(page: Page, local: unknown) {
  const writes: Record<string, unknown>[] = [];
  await page.addInitScript(
    ({ userId, storageKey, local }) => {
      const token = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 }))}.synthetic`;
      localStorage.setItem(
        'werktag-learning-auth',
        JSON.stringify({
          access_token: token,
          refresh_token: 'synthetic-refresh',
          token_type: 'bearer',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: userId,
            email: 'progress@example.invalid',
            aud: 'authenticated',
            role: 'authenticated',
          },
        }),
      );
      localStorage.setItem(storageKey, JSON.stringify(local));
    },
    { userId, storageKey, local },
  );
  await page.route('https://test-werktag.supabase.co/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/shk_learning_progress')) {
      if (route.request().method() === 'GET')
        return route.fulfill({ json: { state: remote, revision: 7 } });
      writes.push(route.request().postDataJSON());
      return route.fulfill({ json: { revision: 8 } });
    }
    if (path.endsWith('/shk_learning_data'))
      return route.fulfill({ json: { rulesVersion: 'shk-levels/2', catalog: [], rounds: [] } });
    return route.fulfill({ json: {} });
  });
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('button', { name: /^Mein Fragenbestand/ })
    .click();
  await page.getByText('Dein Lernkonto', { exact: true }).click();
  return writes;
}

test('a future local progress version never overwrites valid cloud history', async ({ page }) => {
  const future = { ...remote, version: 2, futureField: 'synthetic-preserve-verbatim' };
  const writes = await progressFixture(page, future);
  await expect(
    page.getByText(/Dieser Lernstand stammt aus einer neueren App-Version/),
  ).toBeVisible();
  // Cover the automatic save delay after the failed local merge, not just the GET response.
  await page.waitForTimeout(1200);
  expect(writes).toEqual([]);
  await expect(
    page.getByText(
      'Der lokale Lernstand konnte nicht übernommen werden. Die Cloud wird nicht überschrieben.',
    ),
  ).toBeVisible();
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey)).toEqual(
    future,
  );
});

test('a supported local progress version still merges cloud attempts without losing either record', async ({
  page,
}) => {
  const local = {
    version: 1,
    attempts: [
      {
        id: 'synthetic-local-attempt',
        exerciseId: exercises[1].id,
        answer: exercises[1].correctIndex,
        correct: true,
        answeredAt: '2026-10-23T13:00:00.000Z',
      },
    ],
    bookmarks: [exercises[1].id],
    dailyGoal: 3,
  };
  const merged = {
    ...local,
    attempts: [...remote.attempts, ...local.attempts],
    bookmarks: [...remote.bookmarks, ...local.bookmarks],
  };
  const writes = await progressFixture(page, local);
  await expect(page.getByText('In der Cloud gespeichert.', { exact: true })).toBeVisible();
  expect(writes).toHaveLength(1);
  expect(writes[0]).toMatchObject({
    state: merged,
    revision: 8,
  });
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey)).toEqual(
    merged,
  );
});
