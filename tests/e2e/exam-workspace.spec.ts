import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { exercises } from '../../src/data';

const learningKey = 'werktag-learning-v1';
const sessionKey = 'werktag-exam-session-v1:guest';

async function openExam(page: Page) {
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('button', { name: 'Prüfungsbereich', exact: true })
    .click();
}

async function answerCurrentCorrectly(page: Page) {
  const title = await page.locator('#exam-task-title').innerText();
  const task = exercises.find((entry) => entry.title === title)!;
  expect(task).toBeTruthy();
  await page.locator('.exam-answers').getByRole('radio').nth(task.correctIndex).check();
  return task;
}

test('opening the exam area never starts a clock or creates a learning event', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-23T18:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-23T18:00:01Z'));
  await page.goto('/');
  await openExam(page);
  await expect(page.getByRole('switch', { name: 'Prüfungsmodus', exact: true })).toHaveAttribute(
    'aria-checked',
    'false',
  );
  await page.clock.fastForward(65_000);
  await expect(page.getByRole('timer')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Runde starten', exact: true })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), learningKey)).toBeNull();
  expect(await page.evaluate((key) => sessionStorage.getItem(key), sessionKey)).toBeNull();
});

test('learning work survives navigation and mode changes, and hand-in saves all explicit answers once', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-23T18:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-23T18:00:01Z'));
  await page.goto('/');
  await openExam(page);
  await page
    .getByRole('combobox', { name: 'Aufgabenart', exact: true })
    .selectOption('calculation');
  await page.getByRole('button', { name: 'Runde starten', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Gegeben & gesucht', exact: true })
    .fill('Eigene Werte und gesuchte Größe');
  await page
    .getByRole('textbox', { name: 'Rechenweg', exact: true })
    .fill('Erster unabhängiger Rechenschritt');
  await page
    .getByRole('textbox', { name: 'Notizen', exact: true })
    .fill('Einheiten am Schluss kontrollieren');
  const first = await answerCurrentCorrectly(page);
  await page.getByRole('button', { name: 'Nächste Aufgabe', exact: true }).click();
  const second = await answerCurrentCorrectly(page);
  await page.getByRole('button', { name: 'Aufgabe 1, beantwortet', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Gegeben & gesucht', exact: true })).toHaveValue(
    'Eigene Werte und gesuchte Größe',
  );
  await page.clock.fastForward(2_000);
  await page.getByRole('switch', { name: 'Prüfungsmodus', exact: true }).click();
  await expect(page.locator('.calculation-workspace')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Hinweis anzeigen', exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Freier Rechenweg', exact: true })).toHaveValue(
    'Erster unabhängiger Rechenschritt',
  );
  await expect(page.locator('.exam-round-status')).toContainText('Übungsrunde');
  await page
    .getByRole('textbox', { name: 'Freier Rechenweg', exact: true })
    .fill('Rechenweg im freien Prüfungsblatt ergänzt');
  await page.clock.fastForward(2_000);
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('button', { name: 'Übersicht', exact: true })
    .click();
  await page.clock.fastForward(3_000);
  await openExam(page);
  await expect(page.getByTestId('exam-elapsed')).toHaveText('00:07');
  await page.getByRole('switch', { name: 'Prüfungsmodus', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Rechenweg', exact: true })).toHaveValue(
    'Rechenweg im freien Prüfungsblatt ergänzt',
  );
  await expect(page.getByRole('textbox', { name: 'Notizen', exact: true })).toHaveValue(
    'Einheiten am Schluss kontrollieren',
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), learningKey)).toBeNull();
  await page.getByRole('button', { name: 'Runde abgeben', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Rundenergebnis' })).toContainText('2 von 2');
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), learningKey);
  expect(stored.attempts).toHaveLength(2);
  expect(stored.attempts.map((answer: { exerciseId: string }) => answer.exerciseId)).toEqual([
    first.id,
    second.id,
  ]);
  await page.clock.fastForward(10_000);
  await expect(page.getByTestId('exam-elapsed')).toHaveText('00:07');
  await page.reload();
  await openExam(page);
  await expect(page.getByRole('heading', { name: 'Runde abgegeben', exact: true })).toBeVisible();
  await expect(page.getByTestId('exam-elapsed')).toHaveText('00:07');
  expect(
    (await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), learningKey)).attempts,
  ).toHaveLength(2);
});

test('strict mode has a free answer sheet, no learning aids, and does not record unanswered questions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.clock.install({ time: new Date('2026-10-23T18:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-23T18:00:01Z'));
  await page.goto('/');
  await openExam(page);
  await page
    .getByRole('combobox', { name: 'Aufgabenart', exact: true })
    .selectOption('calculation');
  await page.getByRole('switch', { name: 'Prüfungsmodus', exact: true }).click();
  await page.getByRole('button', { name: 'Runde starten', exact: true }).click();
  await expect(page.locator('.exam-mode-bar')).toContainText('eigenen Taschenrechner');
  await expect(page.locator('.calculation-workspace, .exam-hint, .exam-formula')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Freier Rechenweg', exact: true })).toBeVisible();
  await expect(page.locator('.exam-round-status')).toContainText('Prüfungsrunde');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  await page.clock.fastForward(3_000);
  await page.getByRole('button', { name: 'Runde abgeben', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Rundenergebnis' })).toContainText('0 von 0');
  await expect(page.getByTestId('exam-elapsed')).toHaveText('00:03');
  expect(await page.evaluate((key) => localStorage.getItem(key), learningKey)).toBeNull();
  await page.clock.resume();
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('a failed final draft write cannot duplicate attempts when a pending round is restored', async ({
  page,
}) => {
  await page.goto('/');
  await openExam(page);
  await page.getByRole('button', { name: 'Runde starten', exact: true }).click();
  await answerCurrentCorrectly(page);
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (this === sessionStorage && name === key && JSON.parse(value).endedAt !== null)
        throw new DOMException('Simulated final draft write failure', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, sessionKey);
  await page.getByRole('button', { name: 'Runde abgeben', exact: true }).click();
  await expect(page.locator('.exam-session-warning')).toBeVisible();
  const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), learningKey);
  expect(before.attempts).toHaveLength(1);
  expect(before.attempts[0].id).toMatch(/^exam:/);
  await page.reload();
  await openExam(page);
  await page.getByRole('button', { name: 'Runde abgeben', exact: true }).click();
  const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), learningKey);
  expect(after.attempts).toEqual(before.attempts);
});
