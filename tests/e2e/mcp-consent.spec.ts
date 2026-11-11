import { test, expect, type Page } from '@playwright/test';
import { MCP_CLIENT_ID, MCP_CALLBACK, MCP_CALLBACKS } from '../../src/lib/mcp-oauth';
const user = { id: '22222222-2222-4222-8222-222222222222', email: 'synthetic@example.invalid', aud: 'authenticated', role: 'authenticated' };
async function fixture(page: Page, client = MCP_CLIENT_ID, callback = MCP_CALLBACK) {
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
      return route.fulfill({ json: { redirect_url: callback + '?state=synthetic&code=synthetic' } });
    }
    if (url.pathname.includes('/oauth/authorizations/')) return route.fulfill({ json: { authorization_id: 'synthetic-request', client: { id: client, name: 'Nick Cloud MCP', uri: '', logo_uri: '' }, user, scope: 'openid email offline_access', redirect_uri: callback } });
    throw new Error('Unexpected request: ' + url.pathname);
  });
  await page.route('https://chatgpt.com/**', route => route.fulfill({ body: 'Synthetic callback' }));
  return decisions;
}
test('missing authorization ID never offers approval', async ({ page }) => {
  await page.goto('/oauth/consent');
  await expect(page.getByRole('heading', { name: 'Keine gültige Verbindungsanfrage' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lesen und Lernen speichern erlauben' })).toHaveCount(0);
});
test('a foreign OAuth client cannot obtain consent through this page', async ({ page }) => {
  const decisions = await fixture(page, 'foreign-client');
  await page.goto('/oauth/consent?authorization_id=synthetic-request');
  await expect(page.getByRole('status', { name: 'Verbindungsstatus' })).toContainText('nicht freigegeben');
  await expect(page.getByRole('button', { name: 'Lesen und Lernen speichern erlauben' })).toHaveCount(0);
  expect(decisions).toEqual([]);
});
for (const callback of MCP_CALLBACKS) for (const [label, action] of [['Lesen und Lernen speichern erlauben', 'approve'], ['Ablehnen', 'deny']]) {
  test(`explicit ${action} decision is required for ${new URL(callback).pathname}`, async ({ page }) => {
    const decisions = await fixture(page, MCP_CLIENT_ID, callback);
    await page.goto('/oauth/consent?authorization_id=synthetic-request');
    await expect(page.getByRole('button', { name: label })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Deine persönlichen SHK-Lerneinheiten' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'WerkTag-Projektwissen' })).toBeVisible();
    await expect(page.getByText('Mit deiner Freigabe darf die Verbindung deinen Lernplan, Aufgaben und Abgaben lesen.')).toBeVisible();
    await expect(page.getByText(/neue Originalabgaben speichern, fachliche Auswertungen ergänzen/)).toBeVisible();
    await expect(page.getByText(/Änderungen am persönlichen Lernplan übernehmen/)).toBeVisible();
    await expect(page.getByText(/Abgleich mit PC, Web-App oder Notion vorbereiten/)).toBeVisible();
    await expect(page.getByText(/tatsächlich geprüfte Übernahme bestätigen/)).toBeVisible();
    await expect(page.getByText(/allein überträgt noch keine Daten/)).toBeVisible();
    await expect(page.getByText(/Originalantworten bleiben unverändert geschützt/)).toBeVisible();
    await expect(page.getByText(/weiterhin nur suchen und lesen, nicht ändern oder löschen/)).toBeVisible();
    await expect(page.getByText(/keine Google-Administrationsrechte/)).toBeVisible();
    await expect(page.getByText('Zur Zuordnung deines Kontos erhält ChatGPT außerdem deine E-Mail-Adresse.')).toBeVisible();
    expect(decisions).toEqual([]);
    await page.setViewportSize({ width: 320, height: 740 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole('button', { name: label }).click();
    await expect(page).toHaveURL(callback + '?state=synthetic&code=synthetic');
    expect(decisions).toEqual([action]);
  });
}
test('another ChatGPT connection cannot obtain consent', async ({ page }) => {
  const decisions = await fixture(page, MCP_CLIENT_ID, 'https://chatgpt.com/connector/oauth/another-connection');
  await page.goto('/oauth/consent?authorization_id=synthetic-request');
  await expect(page.getByRole('status', { name: 'Verbindungsstatus' })).toContainText('nicht freigegeben');
  await expect(page.getByRole('button', { name: 'Lesen und Lernen speichern erlauben' })).toHaveCount(0);
  expect(decisions).toEqual([]);
});
