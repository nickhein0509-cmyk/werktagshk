import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { exercises } from '../../src/data';

const storageKey = 'werktag-learning-v1';
const firstExercise = exercises[0];

async function navigate(page: Page, label: string) {
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('button', { name: new RegExp(`^${label}`) })
    .click();
}

async function storedState(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), storageKey);
}

async function answerFirstExercise(page: Page, correct = true) {
  await page.getByRole('button', { name: 'Lerneinheit starten' }).click();
  const dialog = page.getByRole('dialog', { name: firstExercise.title });
  const answerIndex = correct
    ? firstExercise.correctIndex
    : (firstExercise.correctIndex + 1) % firstExercise.options.length;
  await dialog.getByRole('radio').nth(answerIndex).check();
  await dialog.getByRole('button', { name: 'Antwort prüfen' }).click();
  return dialog;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('a new learner sees zero progress and no invented history', async ({ page }) => {
  await expect(page.locator('.goal-ring')).toContainText('0/3');
  await expect(page.getByText('0 Lerntage in Folge')).toBeVisible();
  await expect(page.locator('.topic-progress')).toHaveCount(4);
  await expect(page.locator('.topic-progress').filter({ hasText: '0 von 27' })).toHaveCount(4);
  await expect(page.locator('.week-day.done')).toHaveCount(0);
  expect(await storedState(page)).toBeNull();
  await navigate(page, 'Wiederholen');
  await expect(page.getByRole('heading', { name: 'Gerade nichts zu wiederholen.' })).toBeVisible();
});

test('an actual answer reveals its solution and persists once across reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Lerneinheit starten' }).click();
  const dialog = page.getByRole('dialog', { name: firstExercise.title });
  await expect(dialog.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
  await expect(dialog.locator('.explanation')).toHaveCount(0);
  await dialog.getByRole('radio').nth(firstExercise.correctIndex).check();
  await dialog.getByRole('button', { name: 'Antwort prüfen' }).click();
  await expect(dialog.getByRole('heading', { name: 'Richtig. Das sitzt!' })).toBeVisible();
  await expect(dialog.locator('.explanation')).toHaveText(firstExercise.explanation);
  await expect(dialog.getByRole('radio').first()).toBeDisabled();
  expect((await storedState(page)).attempts).toHaveLength(1);
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('.goal-ring')).toContainText('1/3');
  expect((await storedState(page)).attempts[0]).toMatchObject({
    exerciseId: firstExercise.id,
    correct: true,
  });
  await navigate(page, 'Lernwerkstatt');
  await expect(
    page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: firstExercise.title }) }),
  ).toContainText('Zuletzt richtig');
});

test('an incorrect submitted answer becomes a due review immediately', async ({ page }) => {
  const dialog = await answerFirstExercise(page, false);
  await expect(
    dialog.getByRole('heading', { name: 'Noch nicht ganz.', exact: false }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await navigate(page, 'Wiederholen');
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: firstExercise.title })).toBeVisible();
  expect((await storedState(page)).attempts[0].correct).toBe(false);
});

test('topic filtering, search and bookmarks select real exercises', async ({ page }) => {
  await navigate(page, 'Lernwerkstatt');
  await expect(page.getByRole('article')).toHaveCount(108);
  await page.getByRole('button', { name: 'Sanitärtechnik', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(27);
  await page.getByRole('textbox', { name: 'Aufgaben durchsuchen' }).fill('Was passt in das Rohr?');
  await expect(page.getByRole('article')).toHaveCount(1);
  const card = page.getByRole('article');
  await expect(card.getByRole('heading')).toHaveText('Was passt in das Rohr?');
  await card.getByRole('button', { name: 'Was passt in das Rohr? merken', exact: true }).click();
  await page.getByRole('button', { name: 'Suche leeren' }).click();
  await page.getByRole('button', { name: 'Alle Lernfelder', exact: true }).click();
  await page.getByRole('button', { name: /^Gemerkt/ }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.reload();
  await navigate(page, 'Lernwerkstatt');
  await page.getByRole('button', { name: /^Gemerkt/ }).click();
  await expect(page.getByRole('heading', { name: 'Was passt in das Rohr?' })).toBeVisible();
});

test('a changed daily goal survives reload', async ({ page }) => {
  await navigate(page, 'Mein Lernplan');
  await page.getByRole('combobox', { name: 'Aufgaben pro Tag' }).selectOption('5');
  await expect(page.getByRole('status')).toContainText('Tagesziel aktualisiert');
  await page.reload();
  await expect(page.locator('.goal-ring')).toContainText('0/5');
  await navigate(page, 'Mein Lernplan');
  await expect(page.getByRole('combobox', { name: 'Aufgaben pro Tag' })).toHaveValue('5');
});

test('the heat calculator handles decimal commas and invalid input', async ({ page }) => {
  await navigate(page, 'Werkzeugkoffer');
  await expect(page.locator('.calculator-result')).toContainText('2,322');
  await page.getByLabel('Wassermasse').fill('10,5');
  await page.getByLabel('Temperaturdifferenz').fill('20');
  await expect(page.locator('.calculator-result')).toContainText('0,244');
  await expect(page.locator('.calculator-result')).toContainText('877,8 kJ');
  await page.getByLabel('Wassermasse').fill('-1');
  await expect(page.locator('.calculator-result')).toContainText('Bitte eine positive Masse');
  await page.getByLabel('Wassermasse').fill('10');
  await page.getByLabel('Temperaturdifferenz').fill('NaN');
  await expect(page.locator('.calculator-result')).toContainText('Bitte eine positive Masse');
  await page.getByLabel('Temperaturdifferenz').fill('0');
  await expect(page.locator('.calculator-result')).toContainText('0 kWh');
});

test('export preserves progress and import requires explicit replacement', async ({ page }) => {
  await answerFirstExercise(page);
  await page.keyboard.press('Escape');
  await navigate(page, 'Werkzeugkoffer');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Lernstand exportieren', exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const exported = JSON.parse(await readFile(path!, 'utf8'));
  expect(exported.attempts).toHaveLength(1);
  expect(exported.attempts[0].correct).toBe(true);
  const imported = { ...exported, dailyGoal: 7 };
  await page.getByLabel('Lernstanddatei auswählen').setInputFiles({
    name: 'sicherung.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(imported)),
  });
  await expect(page.getByRole('heading', { name: 'Diese Sicherung übernehmen?' })).toBeVisible();
  expect((await storedState(page)).dailyGoal).toBe(3);
  await page.getByRole('button', { name: 'Lernstand ersetzen', exact: true }).click();
  expect((await storedState(page)).dailyGoal).toBe(7);
  expect((await storedState(page)).attempts).toHaveLength(1);
  await page.reload();
  await expect(page.locator('.goal-ring')).toContainText('1/7');
});

test('invalid imports leave the existing learner record untouched', async ({ page }) => {
  await answerFirstExercise(page);
  await page.keyboard.press('Escape');
  await navigate(page, 'Werkzeugkoffer');
  const before = await storedState(page);
  await page.getByLabel('Lernstanddatei auswählen').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  });
  await expect(page.getByRole('alert')).toContainText('kein lesbares JSON');
  expect(await storedState(page)).toEqual(before);
  await page.getByLabel('Lernstanddatei auswählen').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({ version: 1, attempts: [], bookmarks: [], dailyGoal: 999 }),
    ),
  });
  await expect(page.getByRole('alert')).toContainText('keinen gültigen WerkTag-Lernstand');
  expect(await storedState(page)).toEqual(before);
  await expect(page.getByRole('button', { name: 'Lernstand ersetzen', exact: true })).toHaveCount(
    0,
  );
});

test('the exercise dialog supports keyboard entry, Escape and focus restoration', async ({
  page,
}) => {
  const opener = page.getByRole('button', { name: 'Lerneinheit starten' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await storedState(page)).toBeNull();
});

for (const width of [390, 320]) {
  test(`all primary views and the exercise dialog fit a ${width}px mobile viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    async function noOverflow() {
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      ).toBe(true);
    }
    await noOverflow();
    await page.getByRole('button', { name: 'Lerneinheit starten' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await noOverflow();
    expect(
      await page
        .getByRole('dialog')
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
    await page.keyboard.press('Escape');
    for (const label of ['Lernwerkstatt', 'Wiederholen', 'Mein Lernplan', 'Werkzeugkoffer']) {
      await navigate(page, label);
      await noOverflow();
    }
  });
}

test('dashboard and exercise dialog have no automated WCAG A/AA violations', async ({ page }) => {
  const dashboard = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  await page.getByRole('button', { name: 'Lerneinheit starten' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const dialog = await new AxeBuilder({ page })
    .include('dialog')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect({
    dashboard: dashboard.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    })),
    dialog: dialog.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    })),
  }).toEqual({ dashboard: [], dialog: [] });
});

test('an added calculation is searchable, hides its solution and retains its answer', async ({
  page,
}) => {
  const exercise = exercises.find(({ id }) => id === 'sanitaer-geschwindigkeit-v1-2')!;
  await navigate(page, 'Lernwerkstatt');
  await page.getByRole('textbox', { name: 'Aufgaben durchsuchen' }).fill(exercise.title);
  const card = page.getByRole('article');
  await expect(card).toHaveCount(1);
  await card.getByRole('button', { name: 'Üben', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: exercise.title });
  await expect(dialog.locator('.explanation')).toHaveCount(0);
  await dialog.getByRole('radio').nth(exercise.correctIndex).check();
  await dialog.getByRole('button', { name: 'Antwort prüfen' }).click();
  await expect(dialog.locator('.explanation')).toHaveText(exercise.explanation);
  await page.keyboard.press('Escape');
  await page.reload();
  expect((await storedState(page)).attempts).toMatchObject([
    { exerciseId: exercise.id, correct: true },
  ]);
  await navigate(page, 'Lernwerkstatt');
  await page.getByRole('textbox', { name: 'Aufgaben durchsuchen' }).fill(exercise.title);
  await expect(page.getByRole('article')).toContainText('Zuletzt richtig');
});
