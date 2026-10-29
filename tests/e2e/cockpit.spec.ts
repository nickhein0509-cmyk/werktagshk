import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1024, 1366, 1440]) {
  test(`the live cockpit keeps every entry accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width > 800 ? 1000 : 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dein Lernplatz.' })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.exam-priority-card')).toHaveCount(3);
    await expect(page.locator('.topic-card')).toHaveCount(4);
    await expect(page.getByRole('button', { name: 'Lerneinheit starten', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const main = await page.locator('.cockpit-main').boundingBox();
    const rail = await page.getByRole('complementary', { name: 'Heute im Blick' }).boundingBox();
    if (width >= 1200) {
      expect(rail!.x).toBeGreaterThan(main!.x + main!.width);
      expect(Math.abs(rail!.y - main!.y)).toBeLessThan(2);
    } else {
      expect(rail!.y).toBeGreaterThan(main!.y + main!.height);
    }
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
    await mkdir('test-results/cockpit-ui', { recursive: true });
    await page.screenshot({ path: `test-results/cockpit-ui/cockpit-${width}.png`, fullPage: true });
  });
}

test('keyboard jump enters the daily rail and an exercise returns focus to its opener', async ({ page }) => {
  await page.goto('/');
  const jump = page.getByRole('link', { name: 'Heute im Blick' });
  await jump.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Heute im Blick' })).toBeFocused();
  await page.keyboard.press('Tab');
  const start = page.getByRole('button', { name: 'Lerneinheit starten', exact: true });
  await expect(start).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(start).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('werktag-learning-v1'))).toBeNull();
});

test('the cockpit reflows with doubled text without clipped cards', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dein Lernplatz.' })).toBeVisible();
  // Double computed text sizes in one pass; do not compound inherited percentages.
  await page.locator('.flow-cockpit').evaluate(root => {
    const entries = [...root.querySelectorAll<HTMLElement>('*')]
      .filter(element => element.namespaceURI === 'http://www.w3.org/1999/xhtml')
      .map(element => [element, parseFloat(getComputedStyle(element).fontSize)] as const);
    for (const [element, size] of entries) element.style.fontSize = `${size * 2}px`;
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const card of await page.locator('.exam-priority-card, .topic-card, .routine-grid > *').all()) {
    expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  }
  await page.getByRole('button', { name: 'Lerneinheit starten', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
