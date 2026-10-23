import { expect, test } from '@playwright/test';
import { exercises } from '../../src/data';
import { getExerciseKind } from '../../src/lib/exercise-kind';

test('a roomy calculation sheet keeps notes across reload without inventing attempts', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Lerneinheit starten', exact: true }).click();
  const dialog = page.getByRole('dialog');
  expect((await dialog.boundingBox())!.width).toBeGreaterThan(1000);
  await expect(
    dialog.getByRole('textbox', { name: 'Gegeben & gesucht', exact: true }),
  ).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Rechenweg', exact: true }).fill('Q = 120 × 4,18 × 40');
  await dialog
    .getByRole('textbox', { name: 'Notizen', exact: true })
    .fill('Einheit kJ am Ende umrechnen');
  await dialog.getByText('Taschenrechner', { exact: true }).click();
  await dialog.getByLabel('Rechnung', { exact: true }).fill('(120 * 4,18 * 40) / 3600');
  await dialog.getByRole('button', { name: '= Berechnen', exact: true }).click();
  await expect(dialog.locator('.workpad-calculator-output output')).toContainText('5,573');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => localStorage.getItem('werktag-learning-v1'))).toBeNull();
  await page.reload();
  await page.getByRole('button', { name: 'Lerneinheit starten', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Rechenweg', exact: true })).toHaveValue(
    'Q = 120 × 4,18 × 40',
  );
  await expect(page.getByRole('textbox', { name: 'Notizen', exact: true })).toHaveValue(
    'Einheit kJ am Ende umrechnen',
  );
});

test('task type filters distinguish the learning demand', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('button', { name: 'Lernwerkstatt', exact: true })
    .click();
  const filters = page.getByRole('group', { name: 'Aufgabenart filtern' });
  for (const [kind, label] of [
    ['calculation', 'Rechenaufgaben'],
    ['context', 'Kontextaufgaben'],
    ['knowledge', 'Wissensfragen'],
  ] as const) {
    await filters.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByRole('article')).toHaveCount(
      exercises.filter((task) => getExerciseKind(task) === kind).length,
    );
    for (const badge of await page.locator('.exercise-kind').allTextContents())
      expect(badge).toContain(label.slice(0, -1));
  }
  await page.getByRole('textbox', { name: 'Aufgaben durchsuchen' }).fill('nicht vorhanden 846295');
  await page.getByRole('button', { name: 'Filter zurücksetzen', exact: true }).click();
  await expect(
    filters.getByRole('button', { name: 'Alle Aufgabenarten', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('article')).toHaveCount(exercises.length);
});

test('small screens keep the workpad and calculator inside the page', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Lerneinheit starten', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByText('Taschenrechner', { exact: true }).click();
  await expect(dialog.getByLabel('Rechnung', { exact: true })).toBeVisible();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
    true,
  );
  await page.keyboard.press('Escape');
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('button', { name: 'Prüfungsbereich', exact: true })
    .click();
  await expect(page.getByRole('switch', { name: 'Prüfungsmodus', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
