import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { exercises } from '../../src/data';
import { examAreas, getExamAreas } from '../../src/exam';

const storageKey = 'werktag-learning-v1';

async function navigate(page: Page, label: string) {
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('button', { name: label, exact: true })
    .click();
}

test('an examination-area entry filters real questions and preserves an answered case', async ({
  page,
}) => {
  const area = examAreas.find((candidate) => candidate.id === 'arbeitsplanung')!;
  const exercise = exercises.find((candidate) => candidate.id.startsWith('exam-ap-'))!;
  await page.goto('/');
  await page
    .getByRole('button')
    .filter({
      has: page.getByRole('heading', { name: area.title, exact: true }),
    })
    .click();
  const areaFilters = page.getByRole('group', { name: 'Prüfungsbereich filtern' });
  await expect(areaFilters.getByRole('button', { name: area.title, exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('article')).toHaveCount(
    exercises.filter((candidate) => getExamAreas(candidate).includes(area.id)).length,
  );
  await page.getByRole('textbox', { name: 'Aufgaben durchsuchen' }).fill(exercise.title);
  const card = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: exercise.title, exact: true }),
  });
  await card.getByRole('button', { name: `${exercise.title} üben`, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: exercise.title });
  await expect(dialog.locator('.explanation')).toHaveCount(0);
  await dialog.getByRole('radio').nth(exercise.correctIndex).check();
  await dialog.getByRole('button', { name: 'Antwort prüfen', exact: true }).click();
  await expect(dialog.locator('.explanation')).toHaveText(exercise.explanation);
  await page.keyboard.press('Escape');
  await page.reload();
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(stored.attempts).toMatchObject([{ exerciseId: exercise.id, correct: true }]);
  await expect(page.locator('.goal-ring')).toContainText('1/3');
});

test('resetting combined examination, topic, saved and search filters restores all questions', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Prüfungsfragen öffnen', exact: true }).click();
  const areaFilters = page.getByRole('group', { name: 'Prüfungsbereich filtern' });
  const topicFilters = page.getByRole('group', { name: 'Lernfeld filtern' });
  await areaFilters.getByRole('button', { name: 'Arbeitsplanung', exact: true }).click();
  await topicFilters.getByRole('button', { name: 'Wirtschaft & Soziales', exact: true }).click();
  await page.getByRole('button', { name: /^Gemerkt/ }).click();
  const search = page.getByRole('textbox', { name: 'Aufgaben durchsuchen' });
  await search.fill('keine-passende-aufgabe-9862');
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.locator('.results-label [aria-live="polite"]')).toHaveText('0 Aufgaben');
  await page.getByRole('button', { name: 'Filter zurücksetzen', exact: true }).click();
  await expect(search).toHaveValue('');
  await expect(
    areaFilters.getByRole('button', { name: 'Alle Prüfungsbereiche', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    topicFilters.getByRole('button', { name: 'Alle Lernfelder', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /^Gemerkt/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.getByRole('article')).toHaveCount(exercises.length);
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
});

test('a newer record arriving during an open exercise remains intact and can be exported', async ({
  page,
}) => {
  const exercise = exercises[0];
  const futureRaw = JSON.stringify(
    { version: 2, privateFutureState: { marker: 'preserve-verbatim-9862' } },
    null,
    2,
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Lerneinheit starten', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: exercise.title });
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
    key: storageKey,
    raw: futureRaw,
  });
  await dialog.getByRole('radio').nth(exercise.correctIndex).check();
  await dialog.getByRole('button', { name: 'Antwort prüfen', exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(futureRaw);
  await page.keyboard.press('Escape');
  await expect(page.locator('.notice.warning')).toContainText('neueren App-Version');
  await expect(page.locator('.goal-ring')).toContainText('0/3');
  await navigate(page, 'Werkzeugkoffer');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Rohdatensicherung exportieren', exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  expect(await readFile(path!, 'utf8')).toBe(futureRaw);
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(futureRaw);
});
