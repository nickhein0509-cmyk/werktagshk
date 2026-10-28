import { Buffer } from 'node:buffer';
import { CATALOGUE_CSP, cataloguePath, catalogueType } from '../supabase/functions/assistance/catalog.mjs';

const COOKIE = '__Secure-werktag-assistance';
const catalogueFiles = ['app.js','inflate.js','style-0.css','style-1.css','chrome.css','blocks/shk-offline-index.b64',...Array.from({length:42},(_,i)=>`blocks/shk-shard-${i}.b64`)];
const routes = new Map([
  ['pub', ['POST']], ['map/data', ['GET']], ['map/archive', ['GET']],
  ['map/statistics', ['GET']], ['map/context', ['GET', 'POST']],
  ['map/session', ['GET']], ['map/auth', ['POST']], ['map/owner', ['POST']],
  ['map/logout', ['POST']], ['account/status', ['GET']],
  ['account/session', ['POST']], ['account/claim', ['POST']],
  ['health/status', ['GET']], ['health/configure', ['POST']], ['health/disable', ['POST']],
  ['map/components', ['GET','HEAD']], ['map/components/view', ['GET','HEAD']],
  ...catalogueFiles.map(file => ['map/components/' + file, ['GET','HEAD']]),
]);
export function cloudCookie(header = '') {
  return header.split(';').map(s => s.trim()).filter(s => s.startsWith(COOKIE + '=')).join('; ');
}
function reply(res, status, error) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error }));
}
export function createCloudProxy(options = {}) {
  return async (req, res, route) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    if (!routes.get(route)?.includes(req.method)) return reply(res, 405, 'Anfrage nicht unterstützt.');
    const origin = options.publicOrigin ?? process.env.ASSISTANCE_PUBLIC_ORIGIN ?? 'https://werk-tag.com';
    if (req.method === 'POST' && route !== 'pub' && (req.headers.origin !== origin || req.headers['sec-fetch-site'] === 'cross-site')) return reply(res, 403, 'Ungültiger Ursprung.');
    let endpoint;
    try {
      endpoint = new URL(options.endpoint ?? (route.startsWith('health/') ? process.env.ASSISTANCE_HEALTH_URL : process.env.ASSISTANCE_CLOUD_URL) ?? '');
      if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || !/^\/functions\/v1\/[a-z0-9-]+$/.test(endpoint.pathname)) throw Error();
    } catch { return reply(res, 503, 'Die Cloud-Verbindung ist noch nicht eingerichtet.'); }
    const incoming = new URL(req.url ?? '/', origin);
    endpoint.searchParams.set('route', route.startsWith('health/') ? route.slice(7) : route);
    for (const [k, v] of incoming.searchParams) if (k !== 'path' && k !== 'route') endpoint.searchParams.append(k, v);
    const headers = { 'accept-encoding': 'identity' };
    for (const h of ['accept', 'content-type', 'x-csrf-token']) if (typeof req.headers[h] === 'string') headers[h] = req.headers[h];
    if (route === 'pub') {
      if (typeof req.headers.authorization === 'string' && /^Basic [A-Za-z0-9+/]+=*$/i.test(req.headers.authorization)) headers.authorization = req.headers.authorization;
      for (const h of ['x-limit-d', 'x-limit-u', 'content-encoding']) if (typeof req.headers[h] === 'string') headers[h] = req.headers[h];
    } else {
      const cookie = cloudCookie(req.headers.cookie);
      if (cookie) headers.cookie = cookie;
      if ((route.startsWith('account/') || route.startsWith('health/')) && typeof req.headers.authorization === 'string' && /^Bearer [A-Za-z0-9._-]+$/i.test(req.headers.authorization)) headers.authorization = req.headers.authorization;
      if (req.method === 'POST') { headers.origin = origin; headers['sec-fetch-site'] = 'same-origin'; }
    }
    try {
      let bytes;
      if (req.method === 'POST') {
        if (req.body !== undefined && req.body !== null) bytes = Buffer.isBuffer(req.body) ? req.body : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
        else { const chunks = []; let size = 0; for await (const p of req) { size += p.length; if (size > 262144) return reply(res, 413, 'Anfrage zu groß.'); chunks.push(Buffer.from(p)); } bytes = Buffer.concat(chunks); }
        if (bytes.length > 262144) return reply(res, 413, 'Anfrage zu groß.');
      }
      const r = await (options.fetchImpl ?? fetch)(endpoint, { method: req.method, headers, body: bytes, redirect: 'manual', signal: AbortSignal.timeout(20000) });
      if (r.status >= 300 && r.status < 400) throw Error();
      const parts = []; let size = 0;
      if (r.body) for await (const p of r.body) { size += p.length; if (size > 4 * 1024 * 1024) throw Error(); parts.push(Buffer.from(p)); }
      for (const h of ['content-type', 'content-disposition', 'content-security-policy', 'www-authenticate', 'retry-after']) { const value = r.headers.get(h); if (value) res.setHeader(h, value); }
      const catalogue = cataloguePath(route);
      if (catalogue === 'index.html') {
        // Supabase's Edge gateway sanitizes HTML to plain text with a sandbox.
        // Only these fixed, authenticated catalogue routes may render HTML here.
        res.setHeader('Content-Security-Policy', CATALOGUE_CSP);
        if (r.ok || r.status === 401) {
          res.setHeader('Content-Type', catalogueType(catalogue));
        }
      }
      const cookies = (r.headers.getSetCookie?.() ?? []).filter(c => c.startsWith(COOKIE + '='));
      if (route !== 'pub' && cookies.length) res.setHeader('Set-Cookie', cookies);
      res.statusCode = r.status; res.end(Buffer.concat(parts));
    } catch { return reply(res, 502, 'Cloud vorübergehend nicht erreichbar. Deine gespeicherten Daten bleiben erhalten.'); }
  };
}
export const cloudProxy = createCloudProxy();
