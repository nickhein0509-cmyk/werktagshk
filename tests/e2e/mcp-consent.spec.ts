import { test, expect, type Page } from '@playwright/test';
import { MCP_CLIENT_ID, MCP_CALLBACK } from '../../src/lib/mcp-oauth';
const user = { id: '22222222-2222-4222-8222-222222222222', email: 'synthetic@example.invalid', aud: 'authenticated', role: 'authenticated' };
async function fixture(page: Page, client = MCP_CLIENT_ID) {
  const decisions: string[] = [];
  await page.addInitScript(user => {
    const token = [btoa('{"alg":"HS256","typ":"JWT"}'), btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })), 'synthetic'].join('.');
    localStorage.setItem('werktag-learning-auth', JSON.stringify({ access_token: token, refresh_token: 'synthetic', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user }));
  }, user);
  await page.route('https://test-werktag.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/user')) return route.fulfill({ json: user });
    if (url.pathname.endsWith('/consent')) {
      decisions.push(route.request().postDataJSON().action);
      return route.fulfill({ json: { redirect_url: MCP_CALLBACK + '?state=synthetic&code=synthetic' } });
    }
    if (url.pathname.includes('/oauth/authorizations/')) return route.fulfill({ json: { authorization_id: 'synthetic-request', client: { id: client, name: 'Nick Cloud MCP', uri: '', logo_uri: '' }, user, scope: 'openid', redirect_uri: MCP_CALLBACK } });
    throw new Error('Unexpected request: ' + url.pathname);
  });
  await page.route('https://chatgpt.com/**', route => route.fulfill({ body: 'Synthetic callback' }));
  return decisions;
}
test('missing authorization ID never offers approval', async ({ page }) => {
  await page.goto('/oauth/consent');
  await expect(page.getByRole('heading', { name: 'Keine gültige Verbindungsanfrage' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Suchen und Lesen erlauben' })).toHaveCount(0);
});
test('a foreign OAuth client cannot obtain consent through this page', async ({ page }) => {
  const decisions = await fixture(page, 'foreign-client');
  await page.goto('/oauth/consent?authorization_id=synthetic-request');
  await expect(page.getByRole('status', { name: 'Verbindungsstatus' })).toContainText('nicht freigegeben');
  await expect(page.getByRole('button', { name: 'Suchen und Lesen erlauben' })).toHaveCount(0);
  expect(decisions).toEqual([]);
});
for (const [label, action] of [['Suchen und Lesen erlauben', 'approve'], ['Ablehnen', 'deny']]) {
  test(`explicit ${action} decision is required and returned to registered client`, async ({ page }) => {
    const decisions = await fixture(page);
    await page.goto('/oauth/consent?authorization_id=synthetic-request');
    await expect(page.getByRole('button', { name: label })).toBeVisible();
    expect(decisions).toEqual([]);
    await page.setViewportSize({ width: 320, height: 740 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole('button', { name: label }).click();
    await expect(page).toHaveURL(/chatgpt.com\/connector_platform_oauth_redirect/);
    expect(decisions).toEqual([action]);
  });
}
