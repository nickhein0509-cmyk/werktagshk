// The catalogue remains private data. This module contains only its fixed serving contract.
export const CATALOGUE_SOURCE_SHA256 = 'f33a749ef067768c9e86ec4964ddd42bde738f5be6f4eee5375919cf95ec6ace';
export const CATALOGUE_RESOURCE_LIMIT = 2 * 1024 * 1024;
export const CATALOGUE_FILES = Object.freeze([
  'index.html', 'app.js', 'inflate.js', 'style-0.css', 'style-1.css', 'chrome.css',
  'blocks/shk-offline-index.b64', ...Array.from({ length: 42 }, (_, i) => `blocks/shk-shard-${i}.b64`),
]);
export const CATALOGUE_CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const encoder = new TextEncoder();
const digest = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text))), n => n.toString(16).padStart(2, '0')).join('');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
export const catalogueType = path => path === 'index.html' ? 'text/html; charset=utf-8' : path?.endsWith('.js') ? 'text/javascript; charset=utf-8' : path?.endsWith('.css') ? 'text/css; charset=utf-8' : path?.endsWith('.b64') ? 'text/plain; charset=utf-8' : null;
export function cataloguePath(route) {
  if (route === 'map/components' || route === 'map/components/view') return 'index.html';
  const path = typeof route === 'string' && route.startsWith('map/components/') ? route.slice('map/components/'.length) : null;
  return CATALOGUE_FILES.includes(path) && path !== 'index.html' ? path : null;
}
export async function validateCatalogueResource(value) {
  if (!value || !CATALOGUE_FILES.includes(value.path) || typeof value.body !== 'string' || value.body.includes('\0') || value.contentType !== catalogueType(value.path) || value.sourceSha256 !== CATALOGUE_SOURCE_SHA256 || !/^[a-f0-9]{64}$/.test(value.sha256 ?? '')) fail(400, 'Ungültiger Katalogteil.');
  const bytes = encoder.encode(value.body);
  if (!bytes.length || bytes.length > CATALOGUE_RESOURCE_LIMIT) fail(413, 'Katalogteil zu groß.');
  if (new TextDecoder('utf-8', { fatal: true }).decode(bytes) !== value.body || await digest(value.body) !== value.sha256) fail(400, 'Katalog-Prüfsumme stimmt nicht.');
  return { path: value.path, body: value.body, contentType: value.contentType, sha256: value.sha256, bytes: bytes.length, sourceSha256: value.sourceSha256 };
}
const headers = type => ({ 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': CATALOGUE_CSP });
export function catalogueUnauthorized(method = 'GET') {
  const body = '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Komponentenliste · WerkTag</title><body><a href="/projekte">← WerkTag · Projekte</a><h1>Komponentenliste</h1><p>Melde dich mit deinem zugeordneten WerkTag-Konto an oder öffne deinen bestehenden privaten Zugang.</p><a href="/konto">Mein Konto öffnen</a></body></html>';
  return new Response(method === 'HEAD' ? null : body, { status: 401, headers: headers('text/html; charset=utf-8') });
}
export async function catalogueResponse(row, expectedPath, method = 'GET') {
  try {
    if (!row || row.path !== expectedPath) fail(503, 'Katalog vorübergehend nicht verfügbar.');
    const value = await validateCatalogueResource({ path: row.path, body: row.body, contentType: row.content_type, sha256: row.sha256, sourceSha256: row.source_sha256 });
    if (row.bytes !== value.bytes) fail(503, 'Katalog vorübergehend nicht verfügbar.');
    return new Response(method === 'HEAD' ? null : value.body, { headers: { ...headers(value.contentType), 'Content-Length': String(value.bytes) } });
  } catch { fail(503, 'Katalog vorübergehend nicht verfügbar.'); }
}
