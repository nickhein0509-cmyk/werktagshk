import { expect, test } from '@playwright/test';

// No request interception: these exercise the actual local routing middleware.
for (const product of [
  { path: '/assistenz', heading: 'Assistent noch gesperrt' },
  { path: '/assistenz/components', heading: 'Komponentenliste noch gesperrt' },
]) {
  test(`local project navigation reaches ${product.path} and fails closed without a backend`, async ({ page }) => {
    await page.goto('/projekte');
    await page.locator(`a[href="${product.path}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${product.path}$`));
    await expect(page.getByRole('heading', { name: product.heading, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mein Konto öffnen', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Erneut prüfen', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Erneut prüfen', exact: true }).click();
    await expect(page.getByRole('heading', { name: product.heading, exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Mein Konto öffnen', exact: true }).click();
    await expect(page).toHaveURL(/\/konto$/);
  });
}

test('local public modules and trailing-slash documents resolve without SPA fallback', async ({ request }) => {
  for (const path of ['/assistenz/app-v4.js', '/assistenz/route.js', '/assistenz/health-v2.js']) {
    const result = await request.get(path + '?route-check=1');
    expect(result.status()).toBe(200);
    expect(result.headers()['content-type']).toMatch(/javascript/);
    expect(await result.text()).not.toMatch(/<!doctype html>/i);
  }
  for (const path of ['/assistenz/', '/assistenz/components/']) {
    const result = await request.get(path);
    expect(result.status()).toBe(200);
    expect(await result.text()).toContain('/src/assistance-entry.ts');
  }
});

test('private local endpoints return explicit unavailability and never HTML or a session', async ({ request }) => {
  for (const path of ['/assistenz/session', '/assistenz/components/view', '/api/assistenz-account?route=session']) {
    const result = await request.get(path);
    expect(result.status()).toBe(503);
    expect(result.headers()['content-type']).toContain('application/json');
    expect(result.headers()['cache-control']).toBe('no-store');
    expect(result.headers()['set-cookie']).toBeUndefined();
    expect(await result.json()).toMatchObject({ error: 'local_backend_unavailable' });
  }
  const mutation = await request.post('/assistenz/auth', { data: { key: 'synthetic-local-probe' } });
  expect(mutation.status()).toBe(503);
  expect(mutation.headers()['set-cookie']).toBeUndefined();
});
