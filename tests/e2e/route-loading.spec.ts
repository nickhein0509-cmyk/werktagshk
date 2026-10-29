import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('the project chooser does not initialize account or learning modules', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(new URL(request.url()).pathname));
  await page.goto('/projekte');
  await expect(page.getByRole('heading', { name: 'Deine Projekte.' })).toBeVisible();
  expect(requests).not.toContain('/src/App.tsx');
  expect(requests).not.toContain('/src/components/AccountPage.tsx');
  expect(requests.some((path) => path.includes('/src/lib/supabase'))).toBe(false);
  await page.getByRole('link', { name: 'Konto & Anmeldung' }).click();
  await expect(page.getByRole('heading', { name: 'Dein Konto' })).toBeVisible();
  expect(requests).toContain('/src/components/AccountPage.tsx');
  expect(requests).not.toContain('/src/App.tsx');
});

test('a slow route announces loading and keeps an escape to projects', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/src/components/AccountPage.tsx', async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto('/konto', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('status')).toContainText('WerkTag bereitet die Ansicht vor.');
    await expect(page.getByRole('link', { name: 'Zur Projektauswahl' })).toHaveAttribute('href', '/projekte');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(accessibility.violations).toEqual([]);
  } finally {
    release();
  }
  await expect(page.getByRole('heading', { name: 'Dein Konto' })).toBeVisible();
});

for (const [path, modulePath, title] of [
  ['/konto', '/src/components/AccountPage.tsx', 'Dein Konto · WerkTag'],
  ['/', '/src/App.tsx', 'Übersicht · WerkTag SHK'],
]) {
  test(`a failed ${path} import can be retried without clearing local records`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    let attempts = 0;
    await page.addInitScript(() => {
      if (!localStorage.getItem('werktag-learning-v1')) {
        localStorage.setItem('werktag-learning-v1', JSON.stringify({ version: 1, attempts: [], bookmarks: [], dailyGoal: 8 }));
      }
    });
    await page.route(`**${modulePath}`, async (route) => {
      attempts += 1;
      if (attempts === 1) await route.abort('failed');
      else await route.continue();
    });
    await page.goto(path);
    await expect(page.getByRole('alert')).toContainText('Dieser Bereich konnte nicht geöffnet werden.');
    await expect(page.getByRole('link', { name: 'Zur Projektauswahl' })).toHaveAttribute('href', '/projekte');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(accessibility.violations).toEqual([]);
    const original = await page.evaluate(() => localStorage.getItem('werktag-learning-v1'));
    await page.getByRole('button', { name: 'Seite neu laden' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveTitle(title);
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(attempts).toBe(2);
    expect(await page.evaluate(() => localStorage.getItem('werktag-learning-v1'))).toBe(original);
  });
}
