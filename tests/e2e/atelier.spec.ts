import { expect, test } from '@playwright/test';
import packageInfo from '../../package.json' with { type: 'json' };
const { version } = packageInfo;

for (const width of [320, 390]) {
  test(`atelier footer remains reachable above mobile navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const footer = page.locator('.workspace-footer');
    await expect(footer).toContainText(`WerkTag Atelier / ${version}`);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const footerBox = await footer.boundingBox();
    const navBox = await page.getByRole('navigation', { name: 'Hauptnavigation' }).boundingBox();
    expect(footerBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(footerBox!.y + footerBox!.height).toBeLessThanOrEqual(navBox!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
